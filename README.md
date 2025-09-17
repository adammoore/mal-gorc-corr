# MaLDReTH-GORC Correlation Analysis Application

An interactive web application for visualizing and analyzing correlations between the MaLDReTH Research Data Lifecycle stages and GORC (Generic Open Research Cloud) service categories.

## 🚀 Features

### 📊 Interactive Matrix View
- **Correlation Matrix**: Clean tabular display with X/XX markers indicating correlation strength
- **Hover Tooltips**: Detailed descriptions appear on hover
- **Color Coding**: Red (XX) for strong correlations, Green (X) for standard correlations
- **Export Options**: Excel (.xlsx) and CSV formats with cell comments

### 🎯 Radial Visualization
- **Multi-Ring Design**: MaLDReTH stages (center) → GORC categories (middle rings) → Tools (outer ring)
- **Dynamic Arc Coverage**: Category arcs span across all correlated lifecycle stages
- **Interactive Filtering**: Click stages or use category filter buttons
- **Multi-Ring Architecture**: GORC categories distributed across 3 concentric rings to prevent overlap
- **Export Support**: SVG and PNG export options

### 📈 Key Insights
- **Universal Services**: AAI and Helpdesk support all 11 lifecycle stages
- **Critical Infrastructure**: Research Object Repositories essential for 5 core stages
- **Workflow Clustering**: Analysis and processing tools concentrated in middle stages
- **Stage Coverage**: Visual indicators show X/XX stage coverage for each service category

## 🛠️ Technical Stack

- **Backend**: Flask (Python 3.9+)
- **Frontend**: Bootstrap 5, D3.js v7
- **Data Processing**: pandas, openpyxl
- **Visualization**: D3.js with SVG, responsive design
- **Export**: Excel with cell comments, CSV, SVG, PNG

## 📦 Installation

### Prerequisites
- Python 3.9 or higher
- pip package manager

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd mal-gorc-corr

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py

# Or run on custom port
PORT=8080 python app.py
```

### Dependencies
```
Flask==2.3.3
pandas==2.0.3
openpyxl==3.1.2
flask-cors==4.0.0
gunicorn==21.2.0
```

## 🌐 Application Structure

```
mal-gorc-corr/
├── app.py                          # Main Flask application
├── static/
│   └── js/
│       └── radial-visualization.js # D3.js radial visualization
├── templates/
│   ├── index.html                  # Matrix view interface
│   └── radial_visualization.html   # Radial view interface
├── requirements.txt                # Python dependencies
├── updates.txt                     # Detailed change log
└── README.md                       # This file
```

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main correlation matrix interface |
| `/radial` | GET | Interactive radial visualization |
| `/api/correlation-data` | GET | JSON correlation data for matrix |
| `/api/radial-visualization-data` | GET | JSON data for radial visualization |
| `/export/excel` | GET | Download Excel file with correlation matrix |
| `/export/csv/<sheet_type>` | GET | Download CSV (matrix/summary/findings) |

## 📋 Data Structure

### MaLDReTH Lifecycle Stages (11 stages)
1. **CONCEPTUALIZE** - Hypothesis formation and planning
2. **PLAN** - Research design and methodology planning
3. **COLLECT** - Data collection and capture
4. **PROCESS** - Data cleaning and processing
5. **ANALYSE** - Statistical analysis and interpretation
6. **STORE** - Data storage and organization
7. **PUBLISH** - Publication and dissemination
8. **PRESERVE** - Long-term preservation
9. **SHARE** - Data sharing and collaboration
10. **ACCESS** - Data access and retrieval
11. **TRANSFORM** - Data transformation and integration

### GORC Service Categories (9 categories)
- **Research Object Repositories** - Data storage and publishing platforms
- **Discovery Services** - Search and discovery interfaces
- **Direct Research Tools** - Domain-specific analysis tools
- **Workflow Services** - Automation and pipeline tools
- **Vocabulary Services** - Semantic annotation and standards
- **Commons Catalogues** - Service discovery platforms
- **PID Services** - Persistent identifier management
- **AAI Services** - Authentication and authorization
- **Helpdesk Services** - User support and guidance

## 🎨 Visualization Features

### Matrix View
- **Clean Interface**: Shows only X/XX correlation markers
- **Rich Tooltips**: Hover for detailed descriptions
- **Professional Styling**: Color-coded strength indicators
- **Export Ready**: Excel with cell comments, CSV compatibility

### Radial View
- **Multi-Ring Architecture**:
  - Center: MaLDReTH hub
  - Inner ring: 11 lifecycle stages
  - Middle rings: GORC categories (3 concentric rings)
  - Outer ring: Research tools
- **Smart Layout**: Categories distributed by correlation strength
- **Interactive Controls**:
  - Stage filtering (click stages)
  - Category filtering (filter buttons)
  - View controls (Reset, Show All, Hide Lines)
- **Visual Encoding**:
  - Position: Hierarchical importance
  - Color: Correlation strength
  - Arc width: Stage coverage
  - Connections: Relationship strength

## 📊 Key Findings

### Universal Coverage
- **AAI Services**: Security across all 11 stages
- **Helpdesk Services**: Support for every lifecycle stage

### Stage Clustering
- **Early Stages** (Conceptualize→Collect): Direct research tools dominate
- **Middle Stages** (Process→Analyse): Workflow and vocabulary services peak
- **Late Stages** (Store→Access): Repository and PID services essential

### Service Patterns
- **Strong Correlations (XX)**: Critical dependencies, high integration
- **Standard Correlations (X)**: Useful services, moderate integration
- **Coverage Metrics**: Visual indicators show stage penetration

## 🚀 Deployment

### Development
```bash
python app.py
# Runs on http://localhost:5000
```

### Production (with Gunicorn)
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Environment Variables
```bash
export SECRET_KEY="your-secret-key-here"
export FLASK_ENV="production"
export PORT="5000"
```

### AWS EC2 Deployment
1. Set up Python 3.9+ environment
2. Install dependencies: `pip install -r requirements.txt`
3. Configure environment variables
4. Run with Gunicorn: `gunicorn -w 4 -b 0.0.0.0:5000 app:app`
5. Set up nginx reverse proxy
6. Configure SSL certificate

## 🔄 Version History

- **v1.4.0** (Current) - Enhanced radial visualization with multi-ring architecture
- **v1.3.0** - Dynamic arc coverage implementation
- **v1.2.0** - Added D3.js radial visualization
- **v1.1.0** - Refactored correlation display with tooltips
- **v1.0.0** - Initial release with matrix view and Excel export

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📝 License

This project is licensed under CC-BY 4.0 - see the file headers for details.

## 👥 Credits

**Research Data Lifecycle Team**
© 2024 Research Data Lifecycle Team | CC-BY 4.0

---

### 🔍 Quick Navigation
- **Matrix View**: [http://localhost:5000/](http://localhost:5000/)
- **Radial Visualization**: [http://localhost:5000/radial](http://localhost:5000/radial)
- **API Documentation**: See API Endpoints section above
- **Export Data**: Use the export buttons in each view