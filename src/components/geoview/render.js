'use strict';
import { Api } from '../../api/index'
import _ from 'lodash'
import d3 from 'd3'
var utils = require('./utils');
var api = new Api();

function renderMap(layer, options) {
  var geoObject = options.geoObject;
  var path = options.path;

  path.projection()
    .center(geoObject.center)
    .scale(geoObject.scale);

  var selection = utils.setSelection(null, options);
  options.updateInfoCard(selection.info());

  // Click handler
  function updateSelectedItem(datum) {
    d3.event.stopPropagation();

    selection = utils.setSelection(
      datum == selection.current() ? null : datum,
      options);
    var item = selection.current() || geoObject;

    options.updateInfoCard(selection.info());

    var projection = path.projection();
    projection
      .center(item.center)
      .scale(item.scale);

    mapLayer.selectAll('path')
      .attr('stroke', selection.strokeColor)
      .attr('fill', selection.fillColor)
      .attr('class', selection.className)
      .transition()
      .duration(600)
      .ease('cubic-in-out')
      .attr('d', path);

    textLayer
      .attr('hidden', selection.hideLabels);

    textLayer.selectAll('text')
      .attr('fill', selection.textFill)
      .transition()
      .duration(400)
      .ease('cubic-in-out')
      .attr('font-size', selection.textSize)
      .attr('transform', selection.textPosition);
  }

  options.svg.on('click', updateSelectedItem);

  // map
  var mapLayer = layer.append('g')
    .attr('class', 'babbage-geoview-units');
  mapLayer.selectAll('path')
    .data(geoObject.features)
    .enter()
    .append('path')
    .attr('stroke', selection.strokeColor)
    .attr('fill', selection.fillColor)
    .attr('class', selection.className)
    .attr('d', path)
    .on('mouseover', function() {
      // Bring to front
      this.parentNode.appendChild(this);
    })
    .on('click', updateSelectedItem)
    // Hints for each unit
    .append('title')
    .text(selection.title);

  // labels
  var textLayer = layer.append('g')
    .attr('class', 'babbage-geoview-labels')
    .attr('hidden', selection.hideLabels);
  textLayer.selectAll('text')
    .data(geoObject.features)
    .enter()
    .append('text')
    .attr('class', 'babbage-geoview-unit-label')
    .attr('fill', selection.textFill)
    .attr('font-size', selection.textSize)
    .attr('transform', selection.textPosition)
    .text(selection.text);

  if (options.bindResize) {
    options.bindResize(function() {
      var bounds = options.container.node().getBoundingClientRect();

      var widthChanged = bounds.width != options.width;
      var heightChanged = bounds.height != options.height;

      if (widthChanged || heightChanged) {
        options.width = bounds.width;
        options.height = bounds.height;

        utils.updateScales(geoObject, options);

        var item = selection.current() || geoObject;
        path.projection()
          .translate([options.width / 2, options.height / 2])
          .scale(item.scale);

        mapLayer.selectAll('path').attr('d', path);
        textLayer.selectAll('text').attr('transform', selection.textPosition);

        // Hide labels on small resolutions
        textLayer.attr('hidden', selection.hideLabels);
      }
    });
  }

  return {
    updateData: function(data, currencySign) {
      options.data = data || {};
      selection.currencySign(currencySign);

      utils.updateValues(geoObject, options);

      options.updateInfoCard(selection.info());

      mapLayer.selectAll('path')
        .transition()
        .duration(150)
        .ease('cubic')
        .attr('stroke', selection.strokeColor)
        .attr('fill', selection.fillColor);

      mapLayer.selectAll('title')
        .text(selection.title);
    },
    destroy: function() {
      options.svg.on('click', null);
      mapLayer.selectAll('path').on('click', null);
    }
  };
}

function renderInfoCard(options) {
  var card = options.container
    .append('div')
    .attr('class', 'babbage-geoview-infocard')
    .style('display', 'none');

  return function(html) {
    if (!_.isUndefined(html) && (html !== null) && (html !== false)) {
      card
        .style('display', 'block')
        .html(html);
    } else {
      card
        .style('display', 'none');
    }
  };
}

function renderLegend(options) {
  var legend = options.container
    .append('div')
    .attr('class', 'babbage-geoview-legend');

  var update = function(range, currencySign) {
    var items = [];
    _.each(utils.generateValueRanges(range), (item) => {
      var color = options.color(item.scaledValue);
      var title = utils.formatAmount(item.value, currencySign);
      if (item.isMin) {
        title += ' and less';
      }
      if (item.isMax) {
        title += ' and more';
      }
      items.push(
        '<div>' +
        '<i style="background-color: ' + color + '"></i>' +
        '<span>' + title + '</span>' +
        '</div>'
      );
    });
    legend.html(items.reverse().join(''));
  };
  update(options.range, options.currencySign);

  return {
    update: update
  };
}

function render(options) {
  return api.loadGeoJson(options.cosmoApiUrl, options.code).then((geoObject) => {
    var container = d3.select(options.container);
    var bounds = container.node().getBoundingClientRect();
    var svg = container.append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    var colorScale = utils.getLinearColorScale(
      utils.getOrdinalColorScale()(options.code));

    var path = utils.createPath({
      geoObject: geoObject,
      width: bounds.width,
      height: bounds.height
    });

    utils.prepareGeoJson(geoObject, {
      path: path,
      color: colorScale,
      width: bounds.width,
      height: bounds.height,
      data: options.data
    });

    var infoCard = renderInfoCard({
      container: container,
      width: bounds.width,
      height: bounds.height
    });

    var legend = renderLegend({
      container: container,
      width: bounds.width,
      height: bounds.height,
      color: colorScale,
      currencySign: options.currencySign,
      range: geoObject.valueRange
    });

    var map = renderMap(svg.append('g'), {
      container: container,
      svg: svg,
      geoObject: geoObject,
      path: path,
      color: colorScale,
      width: bounds.width,
      height: bounds.height,
      currencySign: options.currencySign,
      updateInfoCard: infoCard,
      bindResize: options.bindResize
    });

    return {
      updateData: function(data, currencySign) {
        map.updateData(data, currencySign);
        legend.update(geoObject.valueRange, currencySign);
      },
      destroy: function() {
        map.destroy();
      }
    }
  });
}

module.exports = render;
