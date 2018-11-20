import './index.css';
import { select as d3Select, mouse as d3Mouse } from 'd3-selection';
import 'd3-transition'; // extends d3-selection prototype
import { scaleLinear as d3ScaleLinear, scalePow as d3ScalePow } from 'd3-scale';
import { area as d3Area, curveBasis as d3CurveBasis } from 'd3-shape';
import { range as d3Range } from 'd3-array';

import Kapsule from 'kapsule';
import accessorFn from 'accessor-fn';
import indexBy from 'index-array-by';

const MIN_HOVER_DISTANCE = 25; // px

export default Kapsule({
  props: {
    width: { default: window.innerWidth },
    height: { default: 40 },
    data: { default: [] },
    bands: { default: 4 },
    mode: { default: 'offset' }, // or mirror
    x: { default: d => d[0] },
    y: { default: d => d[1] },
    xMin: {}, // undefined means it will derived dynamically from the data
    xMax: {},
    yExtent: {},
    yScaleExp: { default: 1 },
    yAggregation: { default: vals => vals.reduce((agg, val) => agg + val) }, // sum reduce
    positiveColorRange: { default: ['white', 'midnightblue'] },
    negativeColorRange: { default: ['white', 'crimson'] },
    duration: { default: 0, triggerUpdate: false },
    tooltipContent: { default: ({x, y}) => `<b>${x}</b>: ${y}`, triggerUpdate: false },
    onHover: { triggerUpdate: false }
  },

  stateInit() {
    return {
      area: d3Area().curve(d3CurveBasis),
      xScale: d3ScaleLinear(),
      yScale: d3ScalePow(),
      colorScale: d3ScaleLinear()
    }
  },

  init(el, state, { useCanvas = true }) {
    const isD3Selection = !!el && typeof el === 'object' && !!el.node && typeof el.node === 'function';
    const d3El = d3Select(isD3Selection ? el.node() : el);
    d3El.html(null); // Wipe DOM

    const container = d3El.append('div');
    container.attr('class', 'horizon-container');
    state.tooltip = container.append('div').attr('class', 'horizon-tooltip');

    state.useCanvas = useCanvas;

    if (useCanvas) {
      state.canvas = container.append('canvas');
      state.phantomDom = d3Select(document.createElement('phantom'));
    } else { // SVG mode
      state.svg = container.append('svg');
      state.svg.style('display', 'block');
    }
  },

  update(state) {
    // Compute x- and y-values along with extents.
    const xAccessor = accessorFn(state.x);
    const yAccessor = accessorFn(state.y);

    // Aggregate values with same x
    const byX = indexBy(state.data, d => +xAccessor(d));
    let horizonData = Object.entries(byX)
      .map(([x, points]) => [+x, state.yAggregation(points.map(yAccessor)), points])
      .sort(([xa], [xb]) => xa - xb); // sort by sequential x

    const xMin = state.xMin !== undefined && state.xMin !== null ? state.xMin :
      horizonData.length ? horizonData[0][0] : 0;
    const xMax = state.xMax !== undefined && state.xMax !== null ? state.xMax :
      horizonData.length ? horizonData[horizonData.length - 1][0] : 1;
    horizonData = horizonData.filter(([x]) => x >= xMin && x <= xMax); // exclude out of range x values

    const yExtent = state.yExtent || Math.max(0, ...horizonData.map(d => Math.abs(d[1])));

    // Compute the new x- and y-scales, and transform.
    state.xScale.domain([xMin, xMax]).range([0, state.width]);
    state.yScale
      .domain([0, yExtent])
      .range([0, state.height * state.bands])
      .exponent(Math.abs(state.yScaleExp || 1));

    // Set fill colors
    state.colorScale
      .domain([-state.bands, 0, 0, state.bands])
      .range([
        ...state.negativeColorRange.slice(0, 2).reverse(),
        ...state.positiveColorRange.slice(0, 2)
      ]);

    // Add hover interaction
    let hoverPoint = null;
    state[state.useCanvas ? 'canvas' : 'svg']
      .on('mousemove', function() {
        if (!state.onHover && !state.tooltipContent) return; // no need to check

        const mousePos = d3Mouse(this);

        if (state.tooltipContent) {
          state.tooltip
            .style('display', 'inline')
            .style('left', mousePos[0] + 'px')
            .style('top', mousePos[1] + 'px');
        }

        const newHoverPoint = lookupPoint(state.xScale.invert(mousePos[0]));
        if (hoverPoint !== newHoverPoint) {
          hoverPoint = newHoverPoint;

          const hoverData = hoverPoint ? {
            x: hoverPoint[0],
            y: hoverPoint[1],
            points: hoverPoint[2]
          } : null;

          state.onHover && state.onHover(hoverData);
          hoverData && state.tooltipContent && state.tooltip.html(state.tooltipContent(hoverData));
        }

        function lookupPoint(x) {
          let lastPoint = null;
          let lastDistance = Infinity;
          horizonData.some(d => {
            const distance = Math.abs(x - d[0]);
            if (distance > lastDistance) return true; // remaining points are farther
            lastDistance = distance;
            lastPoint = d;
          });

          const mouseDistance = state.xScale(lastDistance) - state.xScale(0);
          if (mouseDistance > MIN_HOVER_DISTANCE) return null; // closest point too far from mouse
          return lastPoint;
        }
      })
      .on('mouseleave', function() {
        state.tooltip.style('display', 'none');
        hoverPoint = null;
        if (state.onHover) {
          state.onHover(null); // signal hover out when leaving canvas
        }
      });

    const bandData = d3Range(-1, -state.bands - 1, -1).concat(d3Range(1, state.bands + 1));

    state.useCanvas ? canvasUpdate() : svgUpdate();

    function svgUpdate() {
      // Adjust svg dimensions
      state.svg.transition().duration(state.duration)
        .attr('width', state.width)
        .attr('height', state.height);

      const y0 = state.height * state.bands;
      const d0 = state.area
        .x(d => state.xScale(d[0]))
        .y0(y0)
        .y1(y0)
      (horizonData);

      const d1 = state.area
        .y1(d => state.height * state.bands - state.yScale(d[1]))
      (horizonData);

      const horizonTransform = d3HorizonTransform(state.bands, state.height, state.mode);

      // Instantiate each copy of the path with different transforms.
      const path = state.svg.selectAll('path')
        .data(bandData, Number);

        path.exit()
          .transition().duration(state.duration)
          .attr('transform', horizonTransform)
          .remove();

      const newPath = path.enter()
        .append('path')
        .style('fill', state.colorScale)
        .attr('transform', horizonTransform)
        .attr('d', d0);

      path.merge(newPath)
        .transition().duration(state.duration)
          .style('fill', state.colorScale)
          .attr('transform', horizonTransform)
          .attr('d', d1);

      //

      function d3HorizonTransform(bands, h, mode) {
        return mode === 'offset'
          ? d => `translate(0,${(d + (d < 0) - bands) * h})`
          : d => `${d < 0 ? 'scale(1,-1)' : ''} translate(0,${(d - bands) * h})`;
      }
    }

    function canvasUpdate() {
      // Instantiate each copy of the path with different transforms.
      const band = state.phantomDom.selectAll('band')
        .data(bandData, Number);

      const yTranslate = getYTranslate(state.bands, state.height, state.mode);
      const yScale = getYScale(state.mode);

      band.exit()
        .transition().duration(state.duration)
        .attr('yTranslate', yTranslate)
        .attr('yScale', yScale)
        .remove();

      const newBand = band.enter()
        .append('band')
        .attr('fillColor', state.colorScale)
        .attr('yTranslate', yTranslate)
        .attr('yScale', yScale)
        .attr('ySize', 0);

      band.merge(newBand)
        .transition().duration(state.duration)
        .attr('fillColor', state.colorScale)
        .attr('yTranslate', yTranslate)
        .attr('yScale', yScale)
        .attr('ySize', 1);

      // Set initial canvas size
      if (!state.phantomDom.attr('canvasWidth')) state.phantomDom.attr('canvasWidth', state.width);
      if (!state.phantomDom.attr('canvasHeight')) state.phantomDom.attr('canvasHeight', state.height);

      state.phantomDom.transition().duration(state.duration)
        .attr('canvasWidth', state.width)
        .attr('canvasHeight', state.height)
        .tween('drawAnimate', () => draw); // draw at every transition tick

      // canvas draw section
      const ctx = state.canvas.node().getContext('2d');
      state.area
        .x(d => state.xScale(d[0]))
        .y0(state.height * state.bands)
        .context(ctx);

      //

      function draw() {
        // Adjust canvas dimensions (and clear)
        const canvasWidth = state.phantomDom.attr('canvasWidth');
        const canvasHeight = state.phantomDom.attr('canvasHeight');
        state.canvas.attr('width', canvasWidth).attr('height', canvasHeight);
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Add area per band
        state.phantomDom.selectAll('band').each(function () {
          const band = d3Select(this);

          ctx.save();
          ctx.scale(1, band.attr('yScale'));
          ctx.translate(0, band.attr('yTranslate'));
          ctx.beginPath();
          state.area
            .y1(d => (state.height * state.bands - state.yScale(d[1]) * band.attr('ySize')))
          (horizonData);
          ctx.restore();

          ctx.fillStyle = band.attr('fillColor');
          ctx.fill();
        });
      }
    }

    function getYTranslate(bands, h, mode) {
      return mode === 'offset'
        ? d => (d + (d < 0) - bands) * h
        : d => (d - bands) * h;
    }

    function getYScale(mode) {
      return d => (mode === 'offset' || d >= 0) ? 1 : -1;
    }
  }
});
