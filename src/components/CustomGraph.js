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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

  useEffect(() => {
    const { width, height } = dimensions;
    console.log(`Drawing graph with dimensions: ${width} ${height}`);
    if (width === 0 || height === 0) return;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('border', '1px solid black');

    svg.selectAll('*').remove(); // Clear existing content

      const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([marginLeft, width - marginRight]);

    const yScale = d3.scaleLinear()
      .domain([-15,15])
      .range([height - marginBottom, marginTop]);

    const line = d3.line()
      .x((d, i) => xScale(i))
      .y(d => yScale(d));

    svg.append('g')
      .call(d3.axisBottom(xScale))
      .attr('transform', `translate(0,${height - marginBottom})`);

    svg.append('g')
      .call(d3.axisLeft(yScale))
      .attr('transform', `translate(${marginLeft},0)`);

    const path = svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        if (!event.sourceEvent.shiftKey) {
        const newXScale = event.transform.rescaleX(xScale);
        const newYScale = event.transform.rescaleY(yScale);
    
        path.attr('d', line.x((d, i) => newXScale(i)).y(d => newYScale(d)));
    
        svg.select('.x-axis').call(d3.axisBottom(newXScale));
        svg.select('.y-axis').call(d3.axisLeft(newYScale));
        }
      });

    svg.call(zoom);

    const handleKeyDown = (event) => {
      if (event.key === 'Shift') {
        svg.on('.zoom', null);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Shift') {
        svg.call(zoom);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [data,dimensions]);

  return <svg ref={svgRef}></svg>;
};

