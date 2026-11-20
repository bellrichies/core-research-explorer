import { Component, ElementRef, OnDestroy, ViewChild, effect, input, signal } from '@angular/core';
import type { ECharts } from 'echarts/core';
import { PublicationYearAnalytics } from '../../../../shared/utils/publication-year.utils';

@Component({
  selector: 'app-publication-chart',
  templateUrl: './publication-chart.html',
  styleUrl: './publication-chart.scss',
})
export class PublicationChart implements OnDestroy {
  readonly analytics = input.required<PublicationYearAnalytics>();
  readonly retrievedCount = input.required<number>();
  readonly query = input.required<string>();

  protected readonly chartReady = signal(false);

  @ViewChild('chart')
  private set chartElement(value: ElementRef<HTMLDivElement> | undefined) {
    this.attachChartHost(value?.nativeElement);
  }

  private chart?: ECharts;
  private chartHost?: HTMLDivElement;
  private initializingHost?: HTMLDivElement;
  private resizeObserver?: ResizeObserver;
  private destroyed = false;
  private readonly updateChart = effect(() => {
    const analytics = this.analytics();
    this.renderChart(analytics);
  });

  ngOnDestroy(): void {
    this.destroyed = true;
    this.updateChart.destroy();
    this.resizeObserver?.disconnect();
    this.chart?.dispose();
  }

  private async initializeChart(element: HTMLDivElement): Promise<void> {
    if (this.initializingHost === element || this.chart) return;
    this.initializingHost = element;

    const [echarts, components, charts, renderers] = await Promise.all([
      import('echarts/core'),
      import('echarts/components'),
      import('echarts/charts'),
      import('echarts/renderers'),
    ]);
    if (this.destroyed || this.chartHost !== element) {
      this.initializingHost = undefined;
      return;
    }

    echarts.use([
      components.AriaComponent,
      charts.BarChart,
      components.GridComponent,
      renderers.SVGRenderer,
      components.TooltipComponent,
    ]);
    this.chart = echarts.init(element, undefined, { renderer: 'svg' });
    this.initializingHost = undefined;
    this.renderChart(this.analytics());
  }

  private renderChart(analytics: PublicationYearAnalytics): void {
    if (!this.chart || analytics.counts.length === 0) return;

    this.chart.setOption(
      {
        animationDuration: 350,
        aria: {
          enabled: true,
          decal: { show: true },
          description: this.chartDescription(analytics),
        },
        grid: { top: 24, right: 12, bottom: 48, left: 48 },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          valueFormatter: (value: unknown) => `${String(value)} paper(s)`,
        },
        xAxis: {
          type: 'category',
          data: analytics.counts.map(({ year }) => String(year)),
          name: 'Publication year',
          nameLocation: 'middle',
          nameGap: 30,
          axisLabel: { color: '#405669', fontSize: 12 },
          axisLine: { lineStyle: { color: '#7a919f' } },
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          name: 'Papers',
          nameTextStyle: { color: '#405669' },
          axisLabel: { color: '#405669', formatter: '{value}' },
          splitLine: { lineStyle: { color: '#dce5ea' } },
        },
        series: [
          {
            type: 'bar',
            data: analytics.counts.map(({ count }) => count),
            barMaxWidth: 44,
            itemStyle: { color: '#176b87', borderRadius: [5, 5, 0, 0] },
            emphasis: { itemStyle: { color: '#0f526b' } },
          },
        ],
      },
      true,
    );
    this.chartReady.set(true);
  }

  private attachChartHost(element: HTMLDivElement | undefined): void {
    if (this.chartHost === element) return;

    this.resizeObserver?.disconnect();
    this.chart?.dispose();
    this.chart = undefined;
    this.chartHost = element;
    this.initializingHost = undefined;
    this.chartReady.set(false);
    if (!element) return;

    const updateChartSize = (): void => {
      if (this.chartHost !== element) return;
      if (this.chart) {
        this.chart.resize();
      } else if (element.clientWidth > 0 && element.clientHeight > 0) {
        void this.initializeChart(element);
      }
    };

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(updateChartSize);
      this.resizeObserver.observe(element);
    }

    updateChartSize();
  }

  private chartDescription(analytics: PublicationYearAnalytics): string {
    const values = analytics.counts.map(({ year, count }) => `${year}: ${count}`).join(', ');
    return `Publication year counts among retrieved papers. ${values}.`;
  }
}
