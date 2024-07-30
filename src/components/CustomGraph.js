import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

export default function LinePlot({
  data,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 20,
  marginLeft = 20
}) {
  const svgRef = useRef();
  const pathRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [drawing, setDrawing] = useState(false);
  const [drawingRect, setDrawingRect] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isRPressed, setIsRPressed] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [lines, setLines] = useState([]);
  const [rects, setRects] = useState([]);

  const getXScale = (width) => d3.scaleLinear()
    .domain([0, data.length - 1])
    .range([marginLeft, width - marginRight]);

  const getYScale = (height) => d3.scaleLinear()
    .domain([-15, 15])
    .range([height - marginBottom, marginTop]);

  // Function to add handles for dragging edges
  const addEdgeHandles = (svg, rect) => {
    const xScale = getXScale(dimensions.width);
    const yScale = getYScale(dimensions.height);

    const dragLeft = d3.drag()
      .on('drag', function (event, d) {
        const newX = Math.min(xScale.invert(event.x), rect.end[0]);
        rect.start[0] = newX;
        d3.select(this).attr('x', xScale(newX) - 5);
        svg.selectAll('.drawn-rect')
          .filter(r => r === rect)
          .attr('x', xScale(rect.start[0]))
          .attr('width', xScale(rect.end[0]) - xScale(rect.start[0]));
      });

    const dragRight = d3.drag()
      .on('drag', function (event, d) {
        const newX = Math.max(xScale.invert(event.x), rect.start[0]);
        rect.end[0] = newX;
        d3.select(this).attr('x', xScale(newX) - 5);
        svg.selectAll('.drawn-rect')
          .filter(r => r === rect)
          .attr('width', xScale(rect.end[0]) - xScale(rect.start[0]));
      });

    svg.append('rect')
      .attr('class', 'left-rect-edge')
      .datum(rect)
      .attr('x', xScale(rect.start[0]) - 5)
      .attr('y', 0)
      .attr('width', 10)
      .attr('height', dimensions.height - marginBottom)
      .attr('fill', 'rgba(0, 0, 0, 0.5)')
      .style('cursor', 'ew-resize')
      .call(dragLeft);

    svg.append('rect')
      .attr('class', 'right-rect-edge')
      .datum(rect)
      .attr('x', xScale(rect.end[0]) - 5)
      .attr('y', 0)
      .attr('width', 10)
      .attr('height', dimensions.height - marginBottom)
      .attr('fill', 'rgba(0, 0, 0, 0.5)')
      .style('cursor', 'ew-resize')
      .call(dragRight);
  };

  // resize effect
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      const width = svgRef.current.parentElement.clientWidth;
      const height = svgRef.current.parentElement.clientHeight;
      setDimensions({ width, height });
      console.log(`Dimensions updated: ${width} ${height}`);
    });

    resizeObserver.observe(svgRef.current.parentElement);

    return () => resizeObserver.unobserve(svgRef.current.parentElement);
  }, []);

  // initial draw
  useEffect(() => {
    const { width, height } = dimensions;
    console.log(`Drawing graph with dimensions: ${width} ${height}`);
    if (width === 0 || height === 0) return;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('border', '1px solid black');

    svg.selectAll('*').remove(); // Clear existing content

    const xScale = getXScale(width);
    const yScale = getYScale(height);

    const lineGenerator = d3.line()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]));

    svg.append('g')
      .attr('class', 'x-axis')
      .call(d3.axisBottom(xScale))
      .attr('transform', `translate(0,${height - marginBottom})`);

    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale))
      .attr('transform', `translate(${marginLeft},0)`);

    const path = svg.append('path')
      .datum(data.map((d, i) => [i, d]))
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', lineGenerator);

    pathRef.current = path;

    // Redraw lines
    lines.forEach(line => {
      svg.append('line')
        .attr('class', 'drawn-line')
        .datum(line)
        .attr('x1', xScale(line.start[0]))
        .attr('x2', xScale(line.end[0]))
        .attr('y1', yScale(line.start[1]))
        .attr('y2', yScale(line.end[1]))
        .attr('stroke', 'black')
        .attr('stroke-width', 1.5);
    });

    // Redraw rectangles
    rects.forEach(rect => {
      svg.append('rect')
        .attr('class', 'drawn-rect')
        .datum(rect)
        .attr('x', xScale(rect.start[0]))
        .attr('y', 0)
        .attr('width', Math.abs(xScale(rect.end[0]) - xScale(rect.start[0])))
        .attr('height', height - marginBottom)
        .attr('fill', 'rgba(255, 0, 0, 0.1)');

      // Add handles for dragging edges
      addEdgeHandles(svg, rect);
    });

  }, [data, dimensions]);

  // zoom
  useEffect(() => {
    const { width, height } = dimensions;
    console.log(`Drawing graph with dimensions: ${width} ${height}`);
    if (width === 0 || height === 0) return;

    const svg = d3.select(svgRef.current);
    const xScale = getXScale(width);
    const yScale = getYScale(height);

    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        if (event.sourceEvent && !event.sourceEvent.shiftKey && !isRPressed) {
          const newXScale = event.transform.rescaleX(xScale);
          const newYScale = event.transform.rescaleY(yScale);

          pathRef.current.attr('d', d3.line()
            .x(d => newXScale(d[0]))
            .y(d => newYScale(d[1]))(data.map((d, i) => [i, d])));

          svg.select('.x-axis').call(d3.axisBottom(newXScale));
          svg.select('.y-axis').call(d3.axisLeft(newYScale));

          svg.selectAll('.drawn-line').attr('x1', d => newXScale(d.start[0]))
            .attr('x2', d => newXScale(d.end[0]))
            .attr('y1', d => newYScale(d.start[1]))
            .attr('y2', d => newYScale(d.end[1]));

          svg.selectAll('.drawn-rect')
            .attr('x', d => newXScale(d.start[0]))
            .attr('width', d => Math.abs(newXScale(d.end[0]) - newXScale(d.start[0])));

          svg.selectAll('.left-rect-edge')
            .attr('x', d => newXScale(d.start[0]) - 5);

          svg.selectAll('.right-rect-edge')
            .attr('x', d => newXScale(d.end[0]) - 5);
        }
      });

    svg.call(zoom);

    const handleKeyUp = (event) => {
      svg.call(zoom);
      if (event.key === 'Shift') {
        setIsShiftPressed(false);
      } else if (event.key === 'r') {
        setIsRPressed(false);
      }
    };

    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [data, dimensions, lines, rects, isRPressed]);

  useEffect(() => {
    const { width, height } = dimensions;
    if (width === 0 || height === 0) return;
    const svg = d3.select(svgRef.current);
    console.log(`${isRPressed} ${drawingRect}`)
    const xScale = getXScale(width);
    const yScale = getYScale(height);

    const handleKeyDown = (event) => {
      svg.on('.zoom', null); // Disable zoom
      if (event.key === 'Shift') {
        setIsShiftPressed(true);
      } else if (event.key === "r") {
        setIsRPressed(true);
      }
    };
    const handleMouseDown = (event) => {
      const [x, y] = d3.pointer(event);
      setStartPoint([xScale.invert(x), yScale.invert(y)]);
      if (isShiftPressed) {
        setDrawing(true);
      } else if (isRPressed) {
        setDrawingRect(true);
      }
    };
    const handleMouseMove = (event) => {
      const [x, y] = d3.pointer(event);
      if (drawing) {
        svg.selectAll('line.temp-line').remove();

        svg.append('line')
          .attr('x1', xScale(startPoint[0]))
          .attr('x2', x)
          .attr('y1', yScale(startPoint[1]))
          .attr('y2', y)
          .attr('stroke', 'black')
          .attr('stroke-width', 1.5)
          .attr('class', 'temp-line');
      } else if (drawingRect) {
        console.log('drawing rect')
        svg.selectAll('rect.temp-rect').remove();

        svg.append('rect')
          .attr('x', xScale(startPoint[0]))
          .attr('y', 0)
          .attr('width', Math.abs(x - xScale(startPoint[0])))
          .attr('height', height - marginBottom)
          .attr('fill', 'rgba(255, 0, 0, 0.1)')
          .attr('class', 'temp-rect');
      }
    };
    const handleMouseUp = (event) => {
      const [x, y] = d3.pointer(event);

      if (drawing) {
        setDrawing(false);
        const newLine = {
          start: startPoint,
          end: [xScale.invert(x), yScale.invert(y)]
        };
        setLines(lines => [...lines, newLine]);
        svg.selectAll('line.temp-line').remove();

        svg.append('line')
          .attr('class', 'drawn-line')
          .datum(newLine)
          .attr('x1', xScale(newLine.start[0]))
          .attr('x2', xScale(newLine.end[0]))
          .attr('y1', yScale(newLine.start[1]))
          .attr('y2', yScale(newLine.end[1]))
          .attr('stroke', 'black')
          .attr('stroke-width', 1.5);
      } else if (drawingRect) {
        console.log(startPoint)
        svg.selectAll('rect.temp-rect').remove();
        const newRect = {
          start: startPoint,
          end: [xScale.invert(x), yScale.invert(y)]
        };
        setRects(rects => [...rects, newRect]);

        setDrawingRect(false);

        svg.append('rect')
          .attr('class', 'drawn-rect')
          .datum(newRect)
          .attr('x', xScale(newRect.start[0]))
          .attr('y', 0)
          .attr('width', Math.abs(xScale(newRect.end[0]) - xScale(newRect.start[0])))
          .attr('height', height - marginBottom)
          .attr('fill', 'rgba(255, 0, 0, 0.1)');

        // Add handles for dragging edges
        addEdgeHandles(svg, newRect);
      }
    };

    svg.on('mousemove', handleMouseMove);
    svg.on('mousemove.zoom', handleMouseMove);
    svg.on('mousedown', handleMouseDown);
    svg.on('mousedown.zoom', handleMouseDown);
    svg.on('mouseup', handleMouseUp);
    svg.on('mouseup.zoom', handleMouseUp);

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawing, isShiftPressed, startPoint, dimensions, isRPressed, drawingRect]);

  return <svg ref={svgRef}></svg>;
}
