/**
 * MaLDReTH Radial Visualization
 * Interactive circular visualization showing relationships between
 * lifecycle stages (center) and tools/services (outer arcs)
 * Version 2.0 - With dynamic arc coverage based on correlations
 */

class MaLDReTHRadialVisualization {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = data;
        this.width = 1200;
        this.height = 1400;
        this.centerRadius = 80;
        this.stageRadius = 180;
        this.categoryBaseRadius = 280;
        this.categoryRingSpacing = 50;
        this.toolRadius = 480;
        this.categoryRings = 3; // Number of concentric rings for categories
        this.colors = {
            stages: d3.scaleOrdinal()
                .domain(data.stages)
                .range(d3.schemeCategory10),
            categoryStrength: d3.scaleOrdinal()
                .domain(['strong', 'standard', 'weak', 'none'])
                .range(['#ff4444', '#44ff44', '#ffff44', '#f0f0f0']),
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
        
        // Create defs element for patterns and gradients
        this.defs = this.svg.append('defs');

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
        
        // Calculate GORC category coverage
        this.calculateCategoryCoverage();
        
        // Create layers
        this.createCenterHub();
        this.createStageRing();
        this.createDynamicCategoryArcs();
        this.createToolArcs();
        this.createConnections();
        this.createLegend();
        this.addInteractivity();
    }
    
    calculateCategoryCoverage() {
        /**
         * Calculate which stages each GORC category covers
         * This determines the arc span for each category
         */
        this.categoryCoverage = {};
        
        this.data.gorcCategories.forEach(category => {
            const coverage = {
                stages: [],
                startAngle: null,
                endAngle: null,
                strength: 'none',
                correlationCount: 0,
                strongCount: 0
            };
            
            // Find all stages this category correlates with
            this.data.stages.forEach((stage, index) => {
                const correlation = this.data.correlations[category.name]?.[stage];
                if (correlation && correlation.marker) {
                    coverage.stages.push({
                        stage: stage,
                        index: index,
                        marker: correlation.marker,
                        description: correlation.description
                    });
                    
                    if (correlation.marker === 'XX') {
                        coverage.strongCount++;
                    }
                    coverage.correlationCount++;
                }
            });
            
            // Calculate angular coverage
            if (coverage.stages.length > 0) {
                const angleStep = (2 * Math.PI) / this.data.stages.length;
                const firstIndex = coverage.stages[0].index;
                const lastIndex = coverage.stages[coverage.stages.length - 1].index;
                
                // Check if the arc should wrap around (e.g., from stage 11 to stage 1)
                let spanIndices = [];
                let currentRun = [coverage.stages[0].index];
                
                for (let i = 1; i < coverage.stages.length; i++) {
                    if (coverage.stages[i].index - coverage.stages[i-1].index <= 2) {
                        currentRun.push(coverage.stages[i].index);
                    } else {
                        spanIndices.push(currentRun);
                        currentRun = [coverage.stages[i].index];
                    }
                }
                spanIndices.push(currentRun);
                
                // Use the longest continuous run
                const longestRun = spanIndices.reduce((a, b) => a.length > b.length ? a : b);
                
                coverage.startAngle = (Math.min(...longestRun) * angleStep) - Math.PI / 2 - angleStep / 4;
                coverage.endAngle = (Math.max(...longestRun) * angleStep) - Math.PI / 2 + angleStep / 4;
                
                // Determine overall strength
                if (coverage.strongCount >= 3) {
                    coverage.strength = 'strong';
                } else if (coverage.correlationCount >= 5) {
                    coverage.strength = 'standard';
                } else if (coverage.correlationCount >= 2) {
                    coverage.strength = 'weak';
                }
            }
            
            this.categoryCoverage[category.name] = coverage;
        });
    }
    
    createCenterHub() {
        // Central MaLDReTH label
        const center = this.g.append('g')
            .attr('class', 'center-hub');
        
        // Gradient definition
        const gradient = this.defs.append('radialGradient')
            .attr('id', 'center-gradient')
            .attr('cx', '50%')
            .attr('cy', '50%')
            .attr('r', '50%');
        
        gradient.append('stop')
            .attr('offset', '0%')
            .style('stop-color', '#4a90e2')
            .style('stop-opacity', 1);
        
        gradient.append('stop')
            .attr('offset', '100%')
            .style('stop-color', '#366092')
            .style('stop-opacity', 1);
        
        center.append('circle')
            .attr('r', this.centerRadius)
            .attr('fill', 'url(#center-gradient)')
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
        
        // Store stage positions for later use
        this.stagePositions = {};
        
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
                
                // Store position
                this.stagePositions[d] = { x, y, angle, index: i };
                
                return `translate(${x}, ${y})`;
            });
        
        // Stage circles with gradient
        stages.each(function(d, i) {
            const group = d3.select(this);
            
            // Create radial gradient for each stage
            const gradientId = `stage-gradient-${i}`;
            const gradient = group.append('defs')
                .append('radialGradient')
                .attr('id', gradientId);
            
            gradient.append('stop')
                .attr('offset', '0%')
                .style('stop-color', d3.schemeCategory10[i % 10])
                .style('stop-opacity', 0.8);
            
            gradient.append('stop')
                .attr('offset', '100%')
                .style('stop-color', d3.schemeCategory10[i % 10])
                .style('stop-opacity', 1);
            
            group.append('circle')
                .attr('r', 35)
                .attr('fill', `url(#${gradientId})`)
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                .attr('class', 'stage-circle')
                .style('cursor', 'pointer');
        });
        
        // Stage labels
        stages.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .style('fill', 'white')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text(d => d.substring(0, 4).toUpperCase());
        
        // Add stage number
        stages.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-1.5em')
            .style('fill', '#666')
            .style('font-size', '9px')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text((d, i) => i + 1);
        
        // Stage connections
        this.createStageConnections(stageGroup);
    }
    
    createStageConnections(stageGroup) {
        const angleStep = (2 * Math.PI) / this.data.stages.length;
        
        // Create curved connections between stages
        const connectionData = [];
        for (let i = 0; i < this.data.stages.length; i++) {
            const nextIndex = (i + 1) % this.data.stages.length;
            const angle1 = i * angleStep - Math.PI / 2;
            const angle2 = nextIndex * angleStep - Math.PI / 2;
            
            connectionData.push({
                source: {
                    x: Math.cos(angle1) * this.stageRadius,
                    y: Math.sin(angle1) * this.stageRadius,
                    angle: angle1
                },
                target: {
                    x: Math.cos(angle2) * this.stageRadius,
                    y: Math.sin(angle2) * this.stageRadius,
                    angle: angle2
                }
            });
        }
        
        stageGroup.selectAll('.stage-connection')
            .data(connectionData)
            .enter()
            .append('path')
            .attr('class', 'stage-connection')
            .attr('d', d => {
                const midAngle = (d.source.angle + d.target.angle) / 2;
                const midRadius = this.stageRadius * 0.85;
                const midX = Math.cos(midAngle) * midRadius;
                const midY = Math.sin(midAngle) * midRadius;
                return `M ${d.source.x},${d.source.y} Q ${midX},${midY} ${d.target.x},${d.target.y}`;
            })
            .attr('fill', 'none')
            .attr('stroke', '#ddd')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3');
    }
    
    createDynamicCategoryArcs() {
        const categoryGroup = this.g.append('g')
            .attr('class', 'category-arcs');

        // Sort categories by strength for ring assignment
        const categoriesWithCoverage = this.data.gorcCategories
            .map(category => ({
                ...category,
                coverage: this.categoryCoverage[category.name]
            }))
            .filter(cat => cat.coverage && cat.coverage.stages.length > 0)
            .sort((a, b) => {
                const strengthOrder = { 'strong': 3, 'standard': 2, 'weak': 1, 'none': 0 };
                return strengthOrder[b.coverage.strength] - strengthOrder[a.coverage.strength];
            });

        categoriesWithCoverage.forEach((category, index) => {
            const coverage = category.coverage;

            // Assign to rings - stronger correlations get inner rings
            const ringIndex = index % 3;
            const categoryRadius = this.categoryBaseRadius + (ringIndex * 60);

            // Calculate arc span based on actual stage coverage
            const stageAngles = coverage.stages.map(stageName => {
                const stageIndex = this.data.stages.indexOf(stageName);
                return (stageIndex * 2 * Math.PI / this.data.stages.length) - Math.PI / 2;
            }).sort((a, b) => a - b);

            let startAngle = stageAngles[0];
            let endAngle = stageAngles[stageAngles.length - 1];

            // Handle wrap-around (e.g., if stages go from 11 to 1)
            if (endAngle - startAngle > Math.PI) {
                [startAngle, endAngle] = [endAngle, startAngle + 2 * Math.PI];
            }

            // Ensure minimum arc size for visibility
            const minArcSize = 0.3;
            if (endAngle - startAngle < minArcSize) {
                const center = (startAngle + endAngle) / 2;
                startAngle = center - minArcSize / 2;
                endAngle = center + minArcSize / 2;
            }

            // Create thinner arc generator
            const innerRadius = categoryRadius - 12; // Reduced thickness
            const outerRadius = categoryRadius + 12; // Reduced thickness

            const arcGenerator = d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius)
                .startAngle(startAngle)
                .endAngle(endAngle)
                .cornerRadius(2);

            // Create arc group
            const arcGroup = categoryGroup.append('g')
                .attr('class', 'category-arc-group')
                .attr('data-category', category.name);

            // Main arc
            const arc = arcGroup.append('path')
                .attr('d', arcGenerator())
                .attr('fill', this.colors.categoryStrength(coverage.strength))
                .attr('stroke', '#fff')
                .attr('stroke-width', 1)
                .attr('class', 'category-arc')
                .attr('data-category', category.name)
                .style('cursor', 'pointer')
                .style('opacity', 0.7);

            // Add pattern for strong correlations
            if (coverage.strength === 'strong') {
                const patternId = `pattern-${category.name.replace(/\s/g, '-')}`;
                const pattern = this.defs.append('pattern')
                    .attr('id', patternId)
                    .attr('patternUnits', 'userSpaceOnUse')
                    .attr('width', 4)
                    .attr('height', 4);

                pattern.append('rect')
                    .attr('width', 4)
                    .attr('height', 4)
                    .attr('fill', this.colors.categoryStrength(coverage.strength));

                pattern.append('path')
                    .attr('d', 'M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 0.5)
                    .attr('opacity', 0.5);

                arc.style('fill', `url(#${patternId})`);
            }

            // Position label at the center of the arc span (closer to arc)
            const labelAngle = (startAngle + endAngle) / 2;
            const labelRadius = outerRadius + 18; // Closer to arc
            const labelX = Math.cos(labelAngle) * labelRadius;
            const labelY = Math.sin(labelAngle) * labelRadius;

            // Calculate text rotation
            let textRotation = (labelAngle * 180 / Math.PI) + 90;
            if (textRotation > 90 && textRotation < 270) {
                textRotation += 180;
            }

            arcGroup.append('text')
                .attr('transform', `translate(${labelX}, ${labelY}) rotate(${textRotation})`)
                .attr('text-anchor', 'middle')
                .style('font-size', '9px')
                .style('font-weight', 'bold')
                .style('fill', '#333')
                .style('pointer-events', 'none')
                .text(category.shortName || category.name.substring(0, 10))
                .attr('class', 'category-label');

            // Add coverage indicator
            const coverageText = `${coverage.stages.length}/${this.data.stages.length}`;
            arcGroup.append('text')
                .attr('transform', `translate(${labelX}, ${labelY}) rotate(${textRotation})`)
                .attr('text-anchor', 'middle')
                .attr('dy', '1.1em')
                .style('font-size', '7px')
                .style('fill', '#666')
                .style('pointer-events', 'none')
                .text(coverageText)
                .attr('class', 'coverage-indicator');
        });
    }
    
    createToolArcs() {
        const toolGroup = this.g.append('g')
            .attr('class', 'tool-arcs');
        
        // Create tool segments aligned with their stages
        const angleStep = (2 * Math.PI) / this.data.stages.length;
        
        this.data.stages.forEach((stage, stageIndex) => {
            const stageAngle = stageIndex * angleStep - Math.PI / 2;
            const tools = this.data.stageTools[stage] || [];
            
            if (tools.length > 0) {
                // Create a small arc for each tool
                const toolArcWidth = (angleStep * 0.8) / tools.length;
                const toolStartAngle = stageAngle - (angleStep * 0.4);
                
                tools.forEach((tool, toolIndex) => {
                    const startAngle = toolStartAngle + (toolIndex * toolArcWidth);
                    const endAngle = startAngle + toolArcWidth * 0.9;
                    
                    const arcGenerator = d3.arc()
                        .innerRadius(this.toolRadius - 30)
                        .outerRadius(this.toolRadius)
                        .startAngle(startAngle)
                        .endAngle(endAngle)
                        .cornerRadius(2);
                    
                    const toolArc = toolGroup.append('path')
                        .attr('d', arcGenerator())
                        .attr('fill', this.colors.tools(tool.category))
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 0.5)
                        .attr('class', 'tool-arc')
                        .attr('data-tool', tool.name)
                        .attr('data-stage', stage)
                        .attr('data-category', tool.category)
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

        // Sort categories the same way as in createDynamicCategoryArcs for ring assignment
        const sortedCategories = this.data.gorcCategories
            .map(category => ({
                ...category,
                coverage: this.categoryCoverage[category.name]
            }))
            .filter(cat => cat.coverage && cat.coverage.stages.length > 0)
            .sort((a, b) => {
                const strengthOrder = { 'strong': 3, 'standard': 2, 'weak': 1, 'none': 0 };
                const strengthDiff = strengthOrder[b.coverage.strength] - strengthOrder[a.coverage.strength];
                if (strengthDiff !== 0) return strengthDiff;
                return b.coverage.stages.length - a.coverage.stages.length;
            });

        // Create connections from stages to their correlated GORC categories
        sortedCategories.forEach((category, index) => {
            const coverage = category.coverage;
            const ringIndex = index % this.categoryRings;
            const categoryRadius = this.categoryBaseRadius + (ringIndex * this.categoryRingSpacing);

            coverage.stages.forEach(stageInfo => {
                const stagePos = this.stagePositions[stageInfo.stage];
                if (!stagePos) return;

                // Calculate arc midpoint for this category at its specific ring
                const categoryMidAngle = (coverage.startAngle + coverage.endAngle) / 2;
                const categoryX = Math.cos(categoryMidAngle) * categoryRadius;
                const categoryY = Math.sin(categoryMidAngle) * categoryRadius;
                
                // Create ribbon connection
                const ribbon = d3.ribbon()
                    .source(() => ({
                        startAngle: stagePos.angle - 0.05,
                        endAngle: stagePos.angle + 0.05,
                        radius: this.stageRadius + 35
                    }))
                    .target(() => ({
                        startAngle: categoryMidAngle - 0.05,
                        endAngle: categoryMidAngle + 0.05,
                        radius: categoryRadius
                    }));
                
                // Create curved path with better control point based on ring position
                const controlRadius = (this.stageRadius + categoryRadius) / 2;
                const controlAngle = (stagePos.angle + categoryMidAngle) / 2;
                const controlX = Math.cos(controlAngle) * controlRadius;
                const controlY = Math.sin(controlAngle) * controlRadius;

                const path = connectionGroup.append('path')
                    .attr('d', `M ${stagePos.x},${stagePos.y} Q ${controlX},${controlY} ${categoryX},${categoryY}`)
                    .attr('fill', 'none')
                    .attr('stroke', stageInfo.marker === 'XX' ? '#ff4444' : '#44ff44')
                    .attr('stroke-width', stageInfo.marker === 'XX' ? 2 : 1)
                    .attr('stroke-opacity', 0.15)
                    .attr('class', 'connection-path')
                    .attr('data-stage', stageInfo.stage)
                    .attr('data-category', category.name)
                    .attr('data-strength', stageInfo.marker);
            });
        });
    }
    
    createLegend() {
        const legendGroup = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(-10, ${this.height - 460})`);
        
        // Background with shadow
        const legendBg = legendGroup.append('rect')
            .attr('width', 230)
            .attr('height', 270)
            .attr('fill', 'rgba(255, 255, 255, 0.95)')
            .attr('stroke', '#ddd')
            .attr('rx', 5)
            .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');
        
        // Title
        legendGroup.append('text')
            .attr('x', 10)
            .attr('y', 25)
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .text('Arc Coverage Legend');
        
        // Legend items
        const items = [
            { color: '#366092', label: 'MaLDReTH Core', type: 'circle' },
            { color: '#4CAF50', label: 'Lifecycle Stages', type: 'circle' },
            { color: '#ff4444', label: 'Strong Correlation (3+ XX)', type: 'arc' },
            { color: '#44ff44', label: 'Standard (5+ X)', type: 'arc' },
            { color: '#ffff44', label: 'Weak (2-4 X)', type: 'arc' },
            { color: '#ddd', label: 'Research Tools', type: 'arc' }
        ];
        
        items.forEach((item, i) => {
            const y = 50 + (i * 25);
            
            if (item.type === 'circle') {
                legendGroup.append('circle')
                    .attr('cx', 20)
                    .attr('cy', y)
                    .attr('r', 8)
                    .attr('fill', item.color);
            } else {
                const arcGen = d3.arc()
                    .innerRadius(5)
                    .outerRadius(10)
                    .startAngle(0)
                    .endAngle(Math.PI);
                
                legendGroup.append('path')
                    .attr('d', arcGen())
                    .attr('transform', `translate(20, ${y})`)
                    .attr('fill', item.color);
            }
            
            legendGroup.append('text')
                .attr('x', 35)
                .attr('y', y + 4)
                .style('font-size', '12px')
                .text(item.label);
        });
        
        // Add notes about visualization structure (with proper spacing)
        legendGroup.append('text')
            .attr('x', 10)
            .attr('y', 205)
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .text('Multi-ring structure:');

        legendGroup.append('text')
            .attr('x', 10)
            .attr('y', 218)
            .style('font-size', '9px')
            .style('font-style', 'italic')
            .text('Categories separated by strength');

        legendGroup.append('text')
            .attr('x', 10)
            .attr('y', 230)
            .style('font-size', '9px')
            .style('font-style', 'italic')
            .text('across multiple concentric rings');
    }
    
    addInteractivity() {
        // Enhanced tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'radial-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background-color', 'rgba(0, 0, 0, 0.95)')
            .style('color', 'white')
            .style('padding', '12px')
            .style('border-radius', '8px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('max-width', '300px')
            .style('box-shadow', '0 4px 8px rgba(0,0,0,0.3)');
        
        // Stage interaction
        this.g.selectAll('.stage-circle')
            .on('mouseenter', function(event, d) {
                const element = d3.select(this);

                // Only animate if not already scaled
                if (!element.classed('stage-hovered')) {
                    element.classed('stage-hovered', true)
                        .transition()
                        .duration(150)
                        .attr('r', 40);
                }

                tooltip.style('visibility', 'visible')
                    .html(`
                        <div style="font-weight: bold; margin-bottom: 5px;">${d}</div>
                        <div>Click to filter connections</div>
                        <div style="color: #aaa; font-size: 10px; margin-top: 5px;">
                            Stage ${d3.select(this.parentNode).datum()} in the lifecycle
                        </div>
                    `);

                // Highlight connections
                d3.selectAll('.connection-path')
                    .style('stroke-opacity', function(pathData) {
                        return d3.select(this).attr('data-stage') === d ? 0.6 : 0.05;
                    });
            })
            .on('mousemove', function(event) {
                tooltip.style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseleave', function() {
                const element = d3.select(this);
                element.classed('stage-hovered', false)
                    .transition()
                    .duration(150)
                    .attr('r', 35);

                tooltip.style('visibility', 'hidden');

                // Reset connections
                d3.selectAll('.connection-path')
                    .style('stroke-opacity', 0.2);
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
                    
                    // Dim non-connected categories
                    d3.selectAll('.category-arc')
                        .style('opacity', function() {
                            const categoryName = d3.select(this).attr('data-category');
                            const hasConnection = d3.selectAll('.connection-path')
                                .filter(function() {
                                    return d3.select(this).attr('data-stage') === d && 
                                           d3.select(this).attr('data-category') === categoryName;
                                })
                                .size() > 0;
                            return hasConnection ? 0.8 : 0.2;
                        });
                } else {
                    // Show all connections
                    d3.selectAll('.connection-path')
                        .style('display', 'block');
                    
                    d3.selectAll('.category-arc')
                        .style('opacity', 0.7);
                }
            });
        
        // Category arc interaction
        this.g.selectAll('.category-arc')
            .on('mouseenter', function(event, d) {
                const categoryName = d3.select(this).attr('data-category');
                const coverage = this.categoryCoverage[categoryName];
                
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
                
                // Build coverage details
                let coverageHtml = `<div style="font-weight: bold; margin-bottom: 8px;">${categoryName}</div>`;
                coverageHtml += `<div style="margin-bottom: 5px;">Coverage: ${coverage.stages.length} stages</div>`;
                
                if (coverage.stages.length > 0) {
                    coverageHtml += '<div style="font-size: 10px; color: #aaa; margin-top: 5px;">Connected stages:</div>';
                    coverageHtml += '<div style="font-size: 11px;">';
                    coverage.stages.forEach(s => {
                        const color = s.marker === 'XX' ? '#ff6666' : '#66ff66';
                        coverageHtml += `<span style="color: ${color}; margin-right: 5px;">${s.stage.substring(0, 4)}</span>`;
                    });
                    coverageHtml += '</div>';
                }
                
                tooltip.style('visibility', 'visible')
                    .html(coverageHtml);
                
                // Highlight related connections
                d3.selectAll('.connection-path')
                    .style('stroke-opacity', function() {
                        return d3.select(this).attr('data-category') === categoryName ? 0.6 : 0.05;
                    });
                
                // Highlight connected stages
                d3.selectAll('.stage-circle')
                    .style('stroke-width', function(d) {
                        const hasConnection = coverage.stages.some(s => s.stage === d);
                        return hasConnection ? 4 : 2;
                    })
                    .style('stroke', function(d) {
                        const connection = coverage.stages.find(s => s.stage === d);
                        if (connection) {
                            return connection.marker === 'XX' ? '#ff4444' : '#44ff44';
                        }
                        return '#fff';
                    });
            })
            .on('mousemove', function(event) {
                tooltip.style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseleave', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 0.7);
                
                tooltip.style('visibility', 'hidden');
                
                // Reset connections
                d3.selectAll('.connection-path')
                    .style('stroke-opacity', 0.2);
                
                // Reset stage highlighting
                d3.selectAll('.stage-circle')
                    .style('stroke-width', 2)
                    .style('stroke', '#fff');
            });
        
        // Tool arc interaction
        this.g.selectAll('.tool-arc')
            .on('mouseenter', function(event) {
                const element = d3.select(this);
                const toolName = element.attr('data-tool');
                const stageName = element.attr('data-stage');
                const categoryName = element.attr('data-category');

                // Only animate if not already scaled
                if (!element.classed('hovered')) {
                    element.classed('hovered', true)
                        .transition()
                        .duration(150)
                        .style('opacity', 1)
                        .style('transform', 'scale(1.05)');
                }

                tooltip.style('visibility', 'visible')
                    .html(`
                        <div style="font-weight: bold; margin-bottom: 5px;">${toolName}</div>
                        <div style="color: #66ff66;">Stage: ${stageName}</div>
                        <div style="color: #ffff66;">Category: ${categoryName}</div>
                    `);
            })
            .on('mousemove', function(event) {
                tooltip.style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseleave', function() {
                const element = d3.select(this);
                element.classed('hovered', false)
                    .transition()
                    .duration(150)
                    .style('opacity', 0.8)
                    .style('transform', 'scale(1)');

                tooltip.style('visibility', 'hidden');
            });
        
        // Make categoryCoverage accessible to interaction functions
        const categoryCoverage = this.categoryCoverage;
        this.g.selectAll('.category-arc').each(function() {
            this.categoryCoverage = categoryCoverage;
        });
    }
    
    // Public method to highlight specific categories
    highlightCategory(categoryName) {
        // Dim all categories except the selected one
        d3.selectAll('.category-arc')
            .style('opacity', function() {
                return d3.select(this).attr('data-category') === categoryName ? 0.9 : 0.2;
            });
        
        // Show only connections for this category
        d3.selectAll('.connection-path')
            .style('stroke-opacity', function() {
                return d3.select(this).attr('data-category') === categoryName ? 0.6 : 0;
            });
    }
    
    // Public method to reset view
    resetView() {
        d3.selectAll('.category-arc').style('opacity', 0.7);
        d3.selectAll('.connection-path').style('stroke-opacity', 0.2).style('display', 'block');
        d3.selectAll('.stage-circle').classed('active', false).style('stroke-width', 2).style('stroke', '#fff');
    }
}

// Initialize visualization when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Fetch data from API
    fetch('/api/radial-visualization-data')
        .then(response => response.json())
        .then(data => {
            window.radialViz = new MaLDReTHRadialVisualization('#radial-viz', data);
            
            // Add control buttons
            document.getElementById('reset-viz').addEventListener('click', () => {
                window.radialViz.resetView();
            });
            
            document.getElementById('show-all-connections').addEventListener('click', () => {
                d3.selectAll('.connection-path')
                    .style('display', 'block')
                    .style('stroke-opacity', 0.2);
                d3.selectAll('.category-arc')
                    .style('opacity', 0.7);
            });
            
            document.getElementById('hide-connections').addEventListener('click', () => {
                d3.selectAll('.connection-path')
                    .style('display', 'none');
            });
            
            // Add category filter buttons - simple and reliable approach
            const filterContainer = document.getElementById('category-filters');
            if (filterContainer) {
                // Clear any existing buttons
                filterContainer.innerHTML = '';

                // Use all GORC categories that have correlations
                const validCategories = data.gorcCategories.filter(category =>
                    data.correlations[category.name]
                );

                console.log('Creating filter buttons for:', validCategories.map(c => c.shortName));

                validCategories.forEach((category, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-sm btn-outline-primary me-1 mb-1';
                    btn.textContent = category.shortName;
                    btn.setAttribute('data-category', category.name);
                    btn.setAttribute('data-index', index);

                    btn.addEventListener('click', function() {
                        console.log('Button clicked for:', category.name);

                        // Reset all buttons to outline style
                        filterContainer.querySelectorAll('button').forEach(b => {
                            if (!b.classList.contains('btn-outline-secondary')) {
                                b.className = 'btn btn-sm btn-outline-primary me-1 mb-1';
                            }
                        });

                        // Set this button to active
                        this.className = 'btn btn-sm btn-primary me-1 mb-1';

                        // Simple direct filtering
                        filterCategoryArcs(category.name);
                    });

                    filterContainer.appendChild(btn);
                });

                // Add reset button
                const resetBtn = document.createElement('button');
                resetBtn.className = 'btn btn-sm btn-outline-secondary me-1 mb-1';
                resetBtn.textContent = 'Show All';
                resetBtn.addEventListener('click', function() {
                    // Reset all buttons
                    filterContainer.querySelectorAll('button').forEach(b => {
                        if (!b.classList.contains('btn-outline-secondary')) {
                            b.className = 'btn btn-sm btn-outline-primary me-1 mb-1';
                        }
                    });
                    this.className = 'btn btn-sm btn-secondary me-1 mb-1';
                    resetCategoryView();
                });
                filterContainer.appendChild(resetBtn);
            }

            // Simple filter function for categories
            function filterCategoryArcs(categoryName) {
                console.log('Filtering for category:', categoryName);

                // Dim all category arcs
                d3.selectAll('.category-arc').style('opacity', 0.1);

                // Highlight selected category arc
                d3.selectAll('.category-arc')
                    .filter(function() {
                        return d3.select(this).attr('data-category') === categoryName;
                    })
                    .style('opacity', 0.9);

                // Hide all connections except for this category
                d3.selectAll('.connection-path').style('display', 'none');
                d3.selectAll('.connection-path')
                    .filter(function() {
                        return d3.select(this).attr('data-category') === categoryName;
                    })
                    .style('display', 'block')
                    .style('stroke-opacity', 0.6);
            }

            // Simple reset function
            function resetCategoryView() {
                console.log('Resetting category view');
                d3.selectAll('.category-arc').style('opacity', 0.7);
                d3.selectAll('.connection-path')
                    .style('display', 'block')
                    .style('stroke-opacity', 0.15);
            }
        })
        .catch(error => {
            console.error('Error loading visualization data:', error);
        });
});
