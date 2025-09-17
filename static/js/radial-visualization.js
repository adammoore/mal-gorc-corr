/**
 * MaLDReTH Radial Visualization
 * Interactive circular visualization showing relationships between
 * lifecycle stages (center) and tools/services (outer arcs)
 */

class MaLDReTHRadialVisualization {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.width = 1200;
        this.height = 1200;
        this.centerRadius = 80;
        this.stageRadius = 180;
        this.categoryRadius = 320;
        this.toolRadius = 480;
        this.colors = {
            stages: d3.scaleOrdinal()
                .domain(data.stages)
                .range(d3.schemeCategory10),
            categories: d3.scaleOrdinal()
                .domain(['strong', 'standard', 'none'])
                .range(['#ff6b6b', '#51cf66', '#f8f9fa']),
            tools: d3.scaleOrdinal()
                .range(d3.schemeSet3)
        };
        
        this.init();
    }
    
    init() {
        // Clear existing visualization
        d3.select(this.containerId).selectAll("*").remove();
        
        // Create SVG
        this.svg = d3.select(this.containerId)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('viewBox', `0 0 ${this.width} ${this.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
        
        // Create main group centered
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.width/2}, ${this.height/2})`);
        
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                this.g.attr('transform', 
                    `translate(${this.width/2}, ${this.height/2}) scale(${event.transform.k})`
                );
            });
        
        this.svg.call(zoom);
        
        // Create layers
        this.createCenterHub();
        this.createStageRing();
        this.createCategoryArcs();
        this.createToolArcs();
        this.createConnections();
        this.createLegend();
        this.addInteractivity();
    }
    
    createCenterHub() {
        // Central MaLDReTH label
        const center = this.g.append('g')
            .attr('class', 'center-hub');
        
        center.append('circle')
            .attr('r', this.centerRadius)
            .attr('fill', '#366092')
            .attr('stroke', '#fff')
            .attr('stroke-width', 3);
        
        center.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.5em')
            .style('fill', 'white')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .text('MaLDReTH');
        
        center.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1em')
            .style('fill', 'white')
            .style('font-size', '12px')
            .text('Research Data Lifecycle');
    }
    
    createStageRing() {
        const angleStep = (2 * Math.PI) / this.data.stages.length;
        const stageGroup = this.g.append('g')
            .attr('class', 'stage-ring');
        
        // Create stage nodes
        const stages = stageGroup.selectAll('.stage-node')
            .data(this.data.stages)
            .enter()
            .append('g')
            .attr('class', 'stage-node')
            .attr('transform', (d, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const x = Math.cos(angle) * this.stageRadius;
                const y = Math.sin(angle) * this.stageRadius;
                return `translate(${x}, ${y})`;
            });
        
        // Stage circles
        stages.append('circle')
            .attr('r', 35)
            .attr('fill', (d) => this.colors.stages(d))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('class', 'stage-circle')
            .style('cursor', 'pointer');
        
        // Stage labels
        stages.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .style('fill', 'white')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text(d => d.substring(0, 4).toUpperCase());
        
        // Add stage connections (circular path)
        const stageConnections = this.data.stages.map((stage, i) => {
            const nextIndex = (i + 1) % this.data.stages.length;
            const angle1 = i * angleStep - Math.PI / 2;
            const angle2 = nextIndex * angleStep - Math.PI / 2;
            return {
                source: {
                    x: Math.cos(angle1) * this.stageRadius,
                    y: Math.sin(angle1) * this.stageRadius
                },
                target: {
                    x: Math.cos(angle2) * this.stageRadius,
                    y: Math.sin(angle2) * this.stageRadius
                }
            };
        });
        
        stageGroup.selectAll('.stage-connection')
            .data(stageConnections)
            .enter()
            .append('line')
            .attr('class', 'stage-connection')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)
            .attr('stroke', '#ddd')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3');
    }
    
    createCategoryArcs() {
        const categoryGroup = this.g.append('g')
            .attr('class', 'category-arcs');
        
        // Calculate arc segments for each GORC category
        const arcGenerator = d3.arc()
            .innerRadius(this.categoryRadius - 30)
            .outerRadius(this.categoryRadius);
        
        const anglePerCategory = (2 * Math.PI) / this.data.gorcCategories.length;
        
        this.data.gorcCategories.forEach((category, i) => {
            const startAngle = i * anglePerCategory - Math.PI / 2;
            const endAngle = (i + 1) * anglePerCategory - Math.PI / 2;
            
            // Determine correlation strength for coloring
            let correlationCount = 0;
            let strongCount = 0;
            
            this.data.stages.forEach(stage => {
                const correlation = this.data.correlations[category.name]?.[stage];
                if (correlation) {
                    if (correlation.marker === 'XX') strongCount++;
                    else if (correlation.marker === 'X') correlationCount++;
                }
            });
            
            const fillColor = strongCount > 3 ? '#ffcccb' : 
                            correlationCount > 5 ? '#90ee90' : 
                            '#e6e6e6';
            
            const arc = categoryGroup.append('path')
                .attr('d', arcGenerator({
                    startAngle: startAngle,
                    endAngle: endAngle
                }))
                .attr('fill', fillColor)
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                .attr('class', 'category-arc')
                .attr('data-category', category.name)
                .style('cursor', 'pointer');
            
            // Add category labels
            const labelAngle = (startAngle + endAngle) / 2;
            const labelRadius = this.categoryRadius + 20;
            const labelX = Math.cos(labelAngle) * labelRadius;
            const labelY = Math.sin(labelAngle) * labelRadius;
            
            categoryGroup.append('text')
                .attr('transform', `translate(${labelX}, ${labelY})`)
                .attr('text-anchor', 'middle')
                .style('font-size', '11px')
                .style('font-weight', 'bold')
                .text(category.shortName || category.name.substring(0, 15))
                .attr('class', 'category-label');
        });
    }
    
    createToolArcs() {
        const toolGroup = this.g.append('g')
            .attr('class', 'tool-arcs');
        
        // Create tool segments for each stage
        const angleStep = (2 * Math.PI) / this.data.stages.length;
        
        this.data.stages.forEach((stage, stageIndex) => {
            const stageAngle = stageIndex * angleStep - Math.PI / 2;
            const tools = this.data.stageTools[stage] || [];
            
            if (tools.length > 0) {
                const toolArcWidth = angleStep / tools.length;
                
                tools.forEach((tool, toolIndex) => {
                    const startAngle = stageAngle + (toolIndex * toolArcWidth);
                    const endAngle = stageAngle + ((toolIndex + 1) * toolArcWidth);
                    
                    const arcGenerator = d3.arc()
                        .innerRadius(this.toolRadius - 40)
                        .outerRadius(this.toolRadius)
                        .startAngle(startAngle)
                        .endAngle(endAngle);
                    
                    toolGroup.append('path')
                        .attr('d', arcGenerator())
                        .attr('fill', this.colors.tools(tool.category))
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 1)
                        .attr('class', 'tool-arc')
                        .attr('data-tool', tool.name)
                        .attr('data-stage', stage)
                        .style('cursor', 'pointer')
                        .style('opacity', 0.8);
                });
            }
        });
    }
    
    createConnections() {
        const connectionGroup = this.g.append('g')
            .attr('class', 'connections')
            .style('pointer-events', 'none');
        
        // Create radial connections from stages to related categories
        const angleStep = (2 * Math.PI) / this.data.stages.length;
        const categoryAngleStep = (2 * Math.PI) / this.data.gorcCategories.length;
        
        this.data.stages.forEach((stage, stageIndex) => {
            const stageAngle = stageIndex * angleStep - Math.PI / 2;
            const stageX = Math.cos(stageAngle) * this.stageRadius;
            const stageY = Math.sin(stageAngle) * this.stageRadius;
            
            this.data.gorcCategories.forEach((category, catIndex) => {
                const correlation = this.data.correlations[category.name]?.[stage];
                
                if (correlation && correlation.marker) {
                    const catAngle = (catIndex + 0.5) * categoryAngleStep - Math.PI / 2;
                    const catRadius = this.categoryRadius - 30;
                    const catX = Math.cos(catAngle) * catRadius;
                    const catY = Math.sin(catAngle) * catRadius;
                    
                    // Create curved path
                    const midRadius = (this.stageRadius + catRadius) / 2;
                    const midX = Math.cos((stageAngle + catAngle) / 2) * midRadius;
                    const midY = Math.sin((stageAngle + catAngle) / 2) * midRadius;
                    
                    const path = connectionGroup.append('path')
                        .attr('d', `M ${stageX},${stageY} Q ${midX},${midY} ${catX},${catY}`)
                        .attr('fill', 'none')
                        .attr('stroke', correlation.marker === 'XX' ? '#ff6b6b' : '#51cf66')
                        .attr('stroke-width', correlation.marker === 'XX' ? 2 : 1)
                        .attr('stroke-opacity', 0.3)
                        .attr('class', 'connection-path')
                        .attr('data-stage', stage)
                        .attr('data-category', category.name);
                }
            });
        });
    }
    
    createLegend() {
        const legendGroup = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(50, 50)');
        
        // Background
        legendGroup.append('rect')
            .attr('width', 200)
            .attr('height', 150)
            .attr('fill', 'white')
            .attr('stroke', '#ddd')
            .attr('rx', 5);
        
        // Title
        legendGroup.append('text')
            .attr('x', 10)
            .attr('y', 20)
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .text('Legend');
        
        // Legend items
        const items = [
            { color: '#366092', label: 'MaLDReTH Core' },
            { color: '#4CAF50', label: 'Lifecycle Stages' },
            { color: '#ffcccb', label: 'High Correlation' },
            { color: '#90ee90', label: 'Medium Correlation' },
            { color: '#e6e6e6', label: 'Low Correlation' }
        ];
        
        items.forEach((item, i) => {
            const y = 40 + (i * 20);
            
            legendGroup.append('rect')
                .attr('x', 10)
                .attr('y', y)
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', item.color);
            
            legendGroup.append('text')
                .attr('x', 30)
                .attr('y', y + 11)
                .style('font-size', '12px')
                .text(item.label);
        });
    }
    
    addInteractivity() {
        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'radial-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background-color', 'rgba(0, 0, 0, 0.9)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000');
        
        // Stage hover
        this.g.selectAll('.stage-circle')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 40);
                
                tooltip.style('visibility', 'visible')
                    .html(`<strong>${d}</strong><br>Click to highlight connections`);
                
                // Highlight connections
                d3.selectAll('.connection-path')
                    .style('stroke-opacity', function(pathData) {
                        return d3.select(this).attr('data-stage') === d ? 0.8 : 0.1;
                    });
            })
            .on('mousemove', function(event) {
                tooltip.style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', 35);
                
                tooltip.style('visibility', 'hidden');
                
                // Reset connections
                d3.selectAll('.connection-path')
                    .style('stroke-opacity', 0.3);
            })
            .on('click', function(event, d) {
                // Toggle stage focus
                const isActive = d3.select(this).classed('active');
                
                d3.selectAll('.stage-circle').classed('active', false);
                d3.select(this).classed('active', !isActive);
                
                if (!isActive) {
                    // Show only connections for this stage
                    d3.selectAll('.connection-path')
                        .style('display', function() {
                            return d3.select(this).attr('data-stage') === d ? 'block' : 'none';
                        });
                } else {
                    // Show all connections
                    d3.selectAll('.connection-path')
                        .style('display', 'block');
                }
            });
        
        // Category arc hover
        this.g.selectAll('.category-arc')
            .on('mouseover', function(event, d) {
                const categoryName = d3.select(this).attr('data-category');
                
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 1)
                    .attr('stroke-width', 3);
                
                tooltip.style('visibility', 'visible')
                    .html(`<strong>${categoryName}</strong><br>GORC Service Category`);
                
                // Highlight related connections
                d3.selectAll('.connection-path')
                    .style('stroke-opacity', function() {
                        return d3.select(this).attr('data-category') === categoryName ? 0.8 : 0.1;
                    });
            })
            .on('mousemove', function(event) {
                tooltip.style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 0.9)
                    .attr('stroke-width', 2);
                
                tooltip.style('visibility', 'hidden');
                
                // Reset connections
                d3.selectAll('.connection-path')
                    .style('stroke-opacity', 0.3);
            });
        
        // Tool arc hover
        this.g.selectAll('.tool-arc')
            .on('mouseover', function(event) {
                const toolName = d3.select(this).attr('data-tool');
                const stageName = d3.select(this).attr('data-stage');
                
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
                
                tooltip.style('visibility', 'visible')
                    .html(`<strong>${toolName}</strong><br>Stage: ${stageName}`);
            })
            .on('mousemove', function(event) {
                tooltip.style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 0.8);
                
                tooltip.style('visibility', 'hidden');
            });
    }
}

// Initialize visualization when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Fetch data from API
    fetch('/api/radial-visualization-data')
        .then(response => response.json())
        .then(data => {
            const visualization = new MaLDReTHRadialVisualization('#radial-viz', data);
            
            // Add control buttons
            document.getElementById('reset-viz').addEventListener('click', () => {
                visualization.init();
            });
            
            document.getElementById('show-all-connections').addEventListener('click', () => {
                d3.selectAll('.connection-path')
                    .style('display', 'block')
                    .style('stroke-opacity', 0.3);
            });
            
            document.getElementById('hide-connections').addEventListener('click', () => {
                d3.selectAll('.connection-path')
                    .style('display', 'none');
            });
        })
        .catch(error => {
            console.error('Error loading visualization data:', error);
        });
});
