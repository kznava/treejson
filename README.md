# JSON Tree Visualizer

A modern web-based tool for visualizing and exploring JSON data with an interactive tree view.

![JSON Tree Visualizer Screenshot](https://i.imgur.com/eXtmuZR.png)
<!-- Replace the above placeholder with an actual screenshot of your application -->

## Overview

JSON Tree is a powerful visualization tool built with Next.js and React that makes it easy to explore, analyze, and understand complex JSON structures through an interactive tree view. Whether you're working with API responses, configuration files, or any structured data, JSON Tree provides an intuitive interface to navigate and inspect your JSON.

This is a hobby project created primarily for learning purposes, aimed at understanding the fundamentals of React, Next.js, and modern web development practices. It is not intended for professional or production use, but rather as a sandbox for experimentation and skill development.

## Features

- **Interactive Tree Visualization**: View your JSON data as an expandable/collapsible tree
- **Monaco Editor Integration**: Edit JSON with a powerful code editor featuring syntax highlighting
- **Multiple View Templates**: Specialized visualizations for different JSON structures:
  - Package.json
  - Package-lock.json
  - GeoJSON
  - Nested JSON (Person with Friends)
  - JSON Arrays
  - YouTube API responses
- **Advanced Search**: Find and navigate between matches with keyboard shortcuts
- **Zoom Controls**: Pan and zoom for exploring large JSON structures
- **Responsive Layout**: Drag to resize the editor/tree panels
- **Dark/Light Mode**: Toggle between themes with keyboard shortcuts
- **Error Handling**: Graceful display of invalid JSON with informative error messages
- **Tree Node Error Boundary**: Prevents the entire tree from crashing when there's an error in rendering a specific node

## Technologies Used

- **Next.js 15**: Modern React framework with App Router for server-side rendering
- **React 19**: UI library for component-based architecture
- **TypeScript**: Static typing for better developer experience
- **Tailwind CSS 4**: Utility-first CSS framework for styling
- **Shadcn UI Components**:
  - Button
  - Card (CardContent, CardHeader, CardTitle)
  - Dropdown Menu
  - Input
  - Tooltip
- **Radix UI**: Unstyled, accessible UI primitives
- **Monaco Editor**: VS Code's editor component for powerful code editing
- **react-zoom-pan-pinch**: Library for zoom and pan functionality
- **D3.js**: For advanced data visualization options

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kznava/treejson.git
   cd treejson
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Basic Usage

1. Paste your JSON into the editor panel on the left
2. The tree visualization will appear in the right panel
3. Click on nodes to expand/collapse them
4. Use the search box to find specific values

### Template Selection

Use the Templates dropdown to select from predefined JSON structures:

- **Package.json**: NPM package configuration
- **Package-lock.json**: NPM dependency lock file
- **GeoJSON**: Geographic data format
- **Nested JSON**: Person with friends example
- **JSON Array**: Array of user objects
- **YouTube JSON**: YouTube API search response

### Using the JSONTree Component

You can also use the JSONTree component directly in your own React applications:

```jsx
import { JSONTree } from '@/components/JSONTree';

function MyComponent() {
  const jsonData = {
    name: "example",
    values: [1, 2, 3],
    nested: {
      key: "value"
    }
  };

  return (
    <div style={{ height: "500px" }}>
      <JSONTree 
        jsonData={jsonData}
        searchTerm=""
        currentSearchIndex={0}
        onSearchResultsUpdate={(total) => console.log(`Found ${total} matches`)}
      />
    </div>
  );
}
```

### Recent Updates

- **TreeNode Error Boundary**: Added robust error handling to prevent the entire tree from crashing
- **Enhanced Zoom Controls**: Improved zoom functionality with better UX
- **Dark Mode Improvements**: Better contrast and visual separation in dark mode
- **Optimized Performance**: Improved rendering performance for large JSON structures
- **TurboJSONTree Component**: Experimental high-performance tree visualization for very large datasets

### Keyboard Shortcuts

- **Ctrl+F**: Focus search input
- **F3**: Navigate to next search result
- **Shift+F3**: Navigate to previous search result
- **Ctrl+J**: Collapse all nodes
- **Ctrl+K**: Expand all nodes
- **Ctrl+**: Zoom in
- **Ctrl-**: Zoom out
- **Ctrl+0**: Reset zoom

## Project Structure

```
treejson/
├── src/                  # Source code
│   ├── app/              # Next.js app router pages
│   │   ├── page.tsx      # Main application page
│   │   ├── layout.tsx    # Root layout with theme provider
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── ui/           # Shadcn UI components
│   │   ├── JSONTree.tsx  # Tree visualization component
│   │   ├── Editor.tsx    # Monaco editor component
│   │   ├── ThemeDetector.tsx # Theme detection component
│   │   ├── ThemeToggle.tsx # Theme toggle component
│   │   └── ThemeProvider.tsx # Theme provider component
│   └── lib/              # Utility functions
├── public/               # Static assets
├── components.json       # Shadcn UI configuration
└── next.config.ts        # Next.js configuration
```

## Key Components

- **JSONTree**: The main tree visualization component with support for different JSON structures
- **Editor**: Monaco-based code editor with template selection and validation
- **ThemeProvider**: Context provider for light/dark mode switching

## Extending the Project

### Adding New Templates

1. Define your template in the appropriate file
2. Add an entry in the templates dropdown
3. Update the editor's template handling logic

### Customizing Visualization

The JSONTree component can be customized to handle specific JSON structures with specialized renderings.

### Customizing Dark Mode

When creating custom visualizations or extending the JSONTree component, follow these guidelines to ensure proper dark mode support:

1. **Use Tailwind's dark mode utilities**:
   ```jsx
   <div className="bg-white dark:bg-gray-800 text-black dark:text-white">
     {/* Content */}
   </div>
   ```

2. **For custom CSS, use CSS variables**:
   ```css
   .my-component {
     background-color: var(--background-color);
     color: var(--text-color);
   }
   ```
   
   ```jsx
   // In your component
   useEffect(() => {
     document.documentElement.style.setProperty(
       '--background-color', 
       theme === 'dark' ? '#1A2333' : '#FFFFFF'
     );
   }, [theme]);
   ```

3. **Style node connectors appropriately**:
   ```jsx
   <div className="json-tree-connector border-l dark:border-[#3B5A97]">
     {/* Content */}
   </div>
   ```

4. **Test all components in both light and dark themes** to ensure proper contrast and readability.

## License

MIT

## Acknowledgements

- [Monaco Editor](https://github.com/microsoft/monaco-editor)
- [Shadcn UI](https://ui.shadcn.com/)
- [react-zoom-pan-pinch](https://github.com/prc5/react-zoom-pan-pinch)
- [Radix UI](https://www.radix-ui.com/)
- [D3.js](https://d3js.org/)