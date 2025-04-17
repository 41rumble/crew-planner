# Crew Planning Tool

An interactive visualization tool for planning crew staffing across a production timeline.

## Features

- **Interactive Visualization**: See your crew plan laid out across months and years
- **Drag and Drop Reordering**: Easily reorder departments and phases
- **Zoom Controls**: Zoom in and out of the visualization for better viewing
- **Time Scale Controls**: Adjust the number of years in your timeline
- **Phase Labels**: Organize your timeline with customizable phase labels
- **Department Management**: Add, edit, remove, and reorder departments
- **Crew Ramping**: Configure ramp-up and ramp-down periods for each department
- **Cost Calculation**: Automatically calculate monthly and cumulative costs
- **Floating Editor Panel**: Edit departments and phases with a movable editor panel
- **CSV Import/Export**: Import and export your crew plan in CSV format
- **Drag Timeline Handles**: Easily adjust department start and end dates by dragging

## Installation

```bash
# Clone the repository
git clone https://github.com/41rumble/crew-planner.git

# Navigate to the project directory
cd crew-planner

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Usage

1. **View the Timeline**: The main table shows departments, their crew sizes, and costs over time
2. **Edit a Department**: Click on any department row to open the editor panel
3. **Edit a Phase**: Click on any phase label to edit its properties
4. **Add New Items**: Use the buttons at the top to add new departments or phases
5. **Reorder Items**: Drag and drop departments or phases to reorder them
6. **Zoom**: Use the zoom controls to adjust the visualization size
7. **Adjust Time Scale**: Use the "Number of Years" dropdown to adjust the timeline duration
8. **Import/Export**: Use the "Export CSV" button to save your plan, or the file uploader to import a CSV
9. **Drag Timeline**: Click and drag the start or end handles of a department to adjust its duration

## CSV Format

The tool supports importing and exporting crew plans in CSV format. The CSV format includes:
- Year headers (Year 1, Year 2, etc.)
- Month headers (Jan Y1, Feb Y1, etc.)
- Phase sections with department rows
- Crew counts for each month
- Monthly and cumulative costs

When importing a CSV:
- The original order of phases and departments is preserved
- Crew counts are imported exactly as they appear in the CSV
- Rates are assigned based on department names (supervisors get higher rates)
- Ramp-up and ramp-down periods are detected automatically

## Recent Improvements

- **Enhanced CSV Import/Export**: Fixed issues with importing and exporting CSV files
- **Improved Phase Ordering**: Phases now appear in the same order as in the imported CSV
- **Fixed Ramp Calculations**: Improved handling of ramp-up and ramp-down periods
- **Better Timeline Dragging**: Fixed issues with dragging department durations
- **Ensured Minimum Crew Values**: Active months now always have at least 1 crew member
- **Improved Cost Calculations**: Fixed issues with cost calculations for imported CSV files
- **Added Time Scale Controls**: Added ability to adjust the number of years in the timeline
- **Enhanced Validation**: Added extensive validation to prevent invalid crew sizes and rates

## License

MIT