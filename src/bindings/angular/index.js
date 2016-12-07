import BubbleTreeDirective from './bubbletree'
import ChartDirective from './chart'
import PieChartDirective from './pie'
import SanKeyChartDirective from './sankey'
import BabbageTableDirective from './table'
import GeoViewDirective from './geoview'
import TreemapDirective from './treemap'
import PivotTableDirective from './pivottable'
import FactsDirective from './facts'
import RadarChartDirective from './radar'

export {
  BubbleTreeDirective,
  ChartDirective,
  PieChartDirective,
  SanKeyChartDirective,
  BabbageTableDirective,
  GeoViewDirective,
  TreemapDirective,
  PivotTableDirective,
  FactsDirective,
  RadarChartDirective
}


import { setExportObject } from '../../api/exporter'

setExportObject(window);
