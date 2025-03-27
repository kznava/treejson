"use client";

import React from 'react';
import { useState, useEffect, useRef, memo, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZoomIn, ZoomOut, Maximize2, Minus, Plus, FolderTree } from 'lucide-react';
import { 
  TransformWrapper, 
  TransformComponent, 
  ReactZoomPanPinchRef, 
  ReactZoomPanPinchContentRef 
} from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Error boundary for TreeNode component
class TreeNodeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 border border-red-300 rounded bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
          <div className="text-sm font-medium">Error rendering JSON</div>
          <div className="text-xs mt-1 opacity-80">{this.state.error?.message || "Unknown error"}</div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add custom CSS for search highlighting and zooming
const styles = `
  .json-tree-node.match-highlight {
    transition: all 0.2s ease-in-out;
  }
  
  .json-tree-node.current-match {
    box-shadow: 0 0 0 3px rgb(234 88 12 / 90%) !important;
    background-color: rgba(234, 88, 12, 0.2) !important;
    transform: scale(1.05);
    z-index: 20;
    position: relative;
  }
  
  .json-tree-node.current-match::before {
    content: '→';
    position: absolute;
    left: -20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    color: rgb(234 88 12);
  }

  /* Light mode styles */
  .light .json-tree-node {
    background-color: white;
    border-color: #e5e7eb;
  }
  
  .light .json-tree-connector {
    border-color: var(--tree-connector-color, #e5e7eb);
  }
  
  .light .json-tree-node.match-highlight {
    background-color: rgba(234, 88, 12, 0.05) !important;
  }
  
  /* Dark mode styles */
  .dark .json-tree-node {
    background-color: #1A2333;
    border-color: #2D3748;
  }
  
  .dark .json-tree-connector {
    border-color: var(--tree-connector-color, #3B5A97);
  }
  
  /* Group indicator styles */
  .node-group {
    position: relative;
  }
  
  .node-group::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: var(--tree-connector-color, rgba(59, 90, 151, 0.5));
    z-index: 0;
  }
  
  .dark .node-group::before {
    background-color: var(--tree-connector-color, rgba(59, 90, 151, 0.5));
  }
  
  .light .node-group::before {
    background-color: var(--tree-connector-color, rgba(229, 231, 235, 0.8));
  }
  
  .node-group-badge {
    position: absolute;
    left: -5px;
    top: -10px;
    padding: 2px 6px;
    font-size: 10px;
    background-color: #3B5A97;
    color: white;
    border-radius: 10px;
    z-index: 2;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    margin-top: 10px;
  }
  
  .light .node-group-badge {
    background-color: #e5e7eb;
    color: #1f2937;
    margin-top: 10px;
  }
  
  /* Group toggle active state */
  .group-toggle-active {
    background-color: rgba(234, 88, 12, 0.1) !important;
    border-color: rgb(234, 88, 12) !important;
  }
  
  /* Zoom controls */
  .zoom-controls {
    position: absolute;
    bottom: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    z-index: 30;
  }
  
  .zoom-controls-horizontal {
    display: flex;
    flex-direction: row;
    gap: 5px;
  }
  
  /* Improved transition effects */
  .json-tree-node {
    transition: all 0.15s ease-in-out;
  }
  
  .json-tree-connector {
    transition: opacity 0.15s ease, height 0.15s ease;
    border-color: var(--tree-connector-color);
  }
  
  /* Hierarchical view styles */
  .root-node {
    position: relative;
    margin: 0 auto;
    background-color: #1A2333;
    border-color: #2D3748;
    border-width: 1px;
    border-style: solid;
    width: fit-content;
    max-width: 300px;
    padding: 10px 15px;
    border-radius: 8px;
    z-index: 2;
  }
  
  .light .root-node {
    background-color: white;
    border-color: #e5e7eb;
  }
  
  .tree-container {
    position: relative;
  }
  
  .tree-branches {
    position: relative;
    display: flex;
    justify-content: space-around;
    padding-top: 30px;
    margin-top: -1px;
    width: 100%;
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .branch {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    width: 550px;
    max-width: 100%;
  }
  
  .branch-node {
    display: flex;
    flex-direction: column;
    padding: 8px 12px;
    border-radius: 6px;
    background-color: #1A2333;
    border: 1px solid #2D3748;
    cursor: pointer;
    z-index: 2;
    min-width: 120px;
    width: 100%;
  }
  
  .light .branch-node {
    background-color: white;
    border-color: #e5e7eb;
  }
  
  .branch-children {
    margin-top: 20px;
    width: 100%;
    max-width: 100%;
    word-wrap: break-word;
    word-break: break-all;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .branch-child-item {
    width: 100%;
    overflow-wrap: break-word;
    overflow: hidden;
  }

  /* Tree Structure Improvements */
  .hierarchy-container {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 10px;
  }
  
  .branch-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  /* SVG Connector styles */
  .tree-connections {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }
  
  .connector-path {
    stroke: var(--tree-connector-color, #3B5A97);
    stroke-width: 1.5;
    fill: none;
    stroke-linecap: round;
  }
  
  .light .connector-path {
    stroke: var(--tree-connector-color, #e5e7eb);
  }

  /* Coordinate display improvements */
  .coordinate-display {
    max-width: 100%;
    overflow-wrap: break-word;
    word-break: break-all;
    white-space: normal;
    font-family: monospace;
    font-size: 12px;
  }

  .property-name {
    word-break: keep-all;
    flex-shrink: 0;
    margin-right: 4px;
  }

  .property-value {
    word-break: break-all;
    overflow-wrap: break-word;
    white-space: normal;
    flex-grow: 1;
    min-width: 0;
  }
`;

const defaultJson = {
  "name": "jsontree",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "prepare": "husky install"
  },
  "dependencies": {
    "@headlessui/react": "^1.7.15",
    "@monaco-editor/react": "^4.5.1",
    "@tailwindcss/forms": "^0.5.4",
    "@types/node": "20.3.2",
    "@types/react": "18.2.14",
    "@types/react-dom": "18.2.6",
    "aliasify": "^2.1.0",
    "autoprefixer": "10.4.14",
    "eslint": "8.43.0",
    "eslint-config-next": "13.4.7"
  },
  "devDependencies": {
    "@types/lodash.debounce": "^4.0.7",
    "husky": "^8.0.3",
    "lint-staged": "^13.2.3"
  }
};

// Get color for different value types
const getNodeColor = (value: any): string => {
  if (value === null) return "#808080"; // gray for null
  if (typeof value === "boolean") return "#C92C2C"; // red for booleans
  if (typeof value === "number") return "#2F5FE0"; // blue for numbers
  if (typeof value === "string") return "#0B7D6E"; // green for strings
  if (Array.isArray(value)) return "#7D2E75"; // purple for arrays
  if (typeof value === "object") return "#1E3A8A"; // blue for objects
  return "#777777"; // default gray
};

interface TreeNodeProps {
  name: string;
  value: any;
  depth?: number;
  isExpanded?: boolean;
  searchTerm?: string;
}

// Memoized value renderer to prevent unnecessary re-renders
const ValueDisplay = memo(({ value, highlight = '' }: { value: any, highlight?: string }) => {
  const renderValue = () => {
    if (value === null) return "null";
    if (typeof value === "boolean") return String(value);
    if (typeof value === "number") return String(value);
    if (typeof value === "string") return `"${value}"`;
    if (Array.isArray(value)) return `Array(${value.length})`;
    return "{}";
  };

  const displayValue = renderValue();
  
  // If there's a highlight term and this is a primitive value, highlight the matching parts
  if (highlight && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
    const stringValue = displayValue;
    const highlightLower = highlight.toLowerCase();
    const valueLower = stringValue.toLowerCase();
    
    // If the value contains the highlight term
    if (valueLower.includes(highlightLower)) {
      const startIndex = valueLower.indexOf(highlightLower);
      const endIndex = startIndex + highlight.length;
      
      return (
        <span className="font-mono ml-2" style={{ color: getNodeColor(value) }}>
          {stringValue.substring(0, startIndex)}
          <span className="bg-orange-500/30 text-orange-100 px-1 rounded">
            {stringValue.substring(startIndex, endIndex)}
          </span>
          {stringValue.substring(endIndex)}
        </span>
      );
    }
  }

  return (
    <span 
      className="font-mono ml-2"
      style={{ color: getNodeColor(value) }}
    >
      {displayValue}
    </span>
  );
});

ValueDisplay.displayName = 'ValueDisplay';

// Custom recursive tree node component (memoized to prevent unnecessary re-renders)
const TreeNode = memo(({ name, value, depth = 0, isExpanded = true, searchTerm = '' }: TreeNodeProps) => {
  // Initialize all hook states at the top level to ensure consistent order
  const [expanded, setExpanded] = useState(isExpanded);
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [connections, setConnections] = useState<{
    rootCenter: {x: number, y: number},
    branches: Array<{id: string, x: number, y: number, valid?: boolean}>
  }>({
    rootCenter: {x: 0, y: 0},
    branches: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  // All useRef calls must be consistently called in every render
  const nodeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootNodeRef = useRef<HTMLDivElement>(null); // Move this ref here from conditional code
  
  // Pull primitive type checks up before any conditional code
  const isPrimitive = value === null || typeof value !== 'object';
  const isArray = Array.isArray(value);
  const hasChildren = !isPrimitive && Object.keys(value).length > 0;
  const isRootNode = name === 'root';
  
  // Protect against extremely nested structures like GeoJSON coordinates
  const safeDepth = Math.min(depth, 10); // Cap depth to prevent excessive nesting

  // Check for GeoJSON-like deeply nested coordinate arrays
  const isGeoJsonCoordinates = 
    name === "coordinates" && 
    Array.isArray(value) && 
    (depth > 5 || 
      (Array.isArray(value[0]) && 
       Array.isArray(value[0][0]) && 
       Array.isArray(value[0][0][0])));
  
  // All useMemo calls
  const shouldGroupChildren = useMemo(() => {
    if (isPrimitive) return false;
    
    // Group if it has more than 5 children
    return Object.keys(value).length > 5;
  }, [value, isPrimitive]);
  
  // Organize data for root node display
  const organizedData = useMemo(() => {
    if (!isRootNode || isPrimitive) return null;
    
    // Handle top-level arrays first
    if (isArray) {
      return {
        basicProps: {},
        categories: { items: value.reduce((acc: Record<string, any>, item: any, idx: number) => {
          acc[`Item ${idx}`] = item;
          return acc;
        }, {}) },
        type: 'array'
      };
    }
    
    // Check if it's a package-lock.json structure
    if (!isArray && value.name && value.packages && typeof value.packages === 'object') {
      // Basic properties for the package-lock
      const basicProps: Record<string, any> = {
        name: value.name,
        version: value.version,
        lockfileVersion: value.lockfileVersion
      };
      
      // Add any other root level primitive properties
      Object.entries(value).forEach(([key, val]) => {
        if (key !== 'packages' && (typeof val !== 'object' || val === null)) {
          basicProps[key] = val;
        }
      });
      
      // Process packages
      const categories: Record<string, any> = {};
      
      // Only include node_modules packages
      Object.entries(value.packages).forEach(([packagePath, packageData]: [string, any]) => {
        if (packagePath.includes('node_modules/')) {
          // Extract the package name from the path (e.g., node_modules/@babel/runtime -> @babel/runtime)
          const pathParts = packagePath.split('node_modules/');
          const packageName = pathParts[pathParts.length - 1];
          
          if (packageName && packageData && typeof packageData === 'object') {
            // Get the scope if any (e.g., @babel from @babel/runtime)
            const scopeMatch = packageName.match(/^(@[^/]+)\//);
            const scope = scopeMatch ? scopeMatch[1] : '';
            
            // Initialize scope category if it doesn't exist
            if (scope && !categories[scope]) {
              categories[scope] = {};
            }
            
            if (scope) {
              categories[scope][packageName] = packageData;
            } else {
              // Put directly in the categories if no scope
              categories[packageName] = packageData;
            }
          }
        }
      });
      
      return { basicProps, categories, type: 'package-lock' };
    }
    
    // Check if it's a person-with-friends structure
    if (!isArray && value.name && value.friends && Array.isArray(value.friends)) {
      // Basic properties for the person
      const basicProps: Record<string, any> = {
        name: value.name
      };
      
      // Add other primitive properties
      Object.entries(value).forEach(([key, val]) => {
        if (key !== 'friends' && (typeof val !== 'object' || val === null)) {
          basicProps[key] = val;
        }
      });
      
      // Add any nested objects that aren't arrays
      Object.entries(value).forEach(([key, val]) => {
        if (key !== 'friends' && typeof val === 'object' && val !== null && !Array.isArray(val)) {
          basicProps[key] = val;
        }
      });
      
      // Extract friends as the main category
      const categories: Record<string, any> = {
        friends: value.friends.reduce((acc: Record<string, any>, friend: any, idx: number) => {
          if (friend && typeof friend === 'object') {
            acc[friend.name || `Friend ${idx}`] = friend;
          }
          return acc;
        }, {})
      };
      
      return { basicProps, categories, type: 'person' };
    }
    
    // Check if it's a package.json-like structure with specific expected properties
    if (!isArray && value.name && value.version !== undefined) {
      // Extract basic properties for root display
      const basicProps = {
        name: value.name,
        version: value.version,
        private: value.private
      };

      // Extract main categories that will be displayed as separate branches
      const categories: Record<string, any> = {
        scripts: value.scripts || {},
        dependencies: value.dependencies || {},
        devDependencies: value.devDependencies || {}
      };
      
      return { basicProps, categories, type: 'package' };
    }
    
    return null;
  }, [isRootNode, value, isPrimitive, isArray]);
  
  // Store branch refs in a memoized map to prevent unnecessary ref callback changes
  const branchRefsMap = useMemo(() => new Map<string, HTMLDivElement | null>(), []);
  
  // More robust check if this node matches the search term
  const isMatch = useMemo(() => {
    if (!searchTerm) return false;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check name match
    if (typeof name === 'string' && name.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Check value match for primitives
    if (isPrimitive) {
      if (value === null) return 'null'.includes(searchLower);
      if (typeof value === 'string') return value.toLowerCase().includes(searchLower);
      return String(value).toLowerCase().includes(searchLower);
    }
    
    return false;
  }, [name, value, isPrimitive, searchTerm]);
  
  // Calculate total pages for pagination
  const itemsPerPage = 50; // Show 50 items per page for performance
  
  const totalPages = useMemo(() => {
    if (isRootNode && isArray) {
      return Math.ceil(value.length / itemsPerPage);
    }
    return 1;
  }, [isRootNode, isArray, value, itemsPerPage]);

  // All useCallback functions
  // Create a stable branch ref callback
  const branchRefCallback = useCallback((id: string) => (el: HTMLDivElement | null) => {
    branchRefsMap.set(id, el);
  }, [branchRefsMap]);
  
  const toggleExpand = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);
  
  const toggleBranchExpansion = useCallback((categoryName: string) => {
    setExpandedBranches(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  }, []);
  
  const getCurrentPageItems = useCallback(() => {
    if (isRootNode && isArray) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, value.length);
      return value.slice(startIndex, endIndex);
    }
    return [];
  }, [isRootNode, isArray, value, currentPage, itemsPerPage]);
  
  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);
  
  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  // All useEffect hooks
  // Measure the container size when expanded
  useEffect(() => {
    if (expanded && hasChildren && containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      setContainerSize({ width: offsetWidth, height: offsetHeight });
    }
  }, [expanded, hasChildren]);
  
  // Initialize branch expansion state
  useEffect(() => {
    if (isRootNode && organizedData) {
      const { categories } = organizedData;
      const validCategories = Object.keys(categories).filter(
        categoryName => categories[categoryName] && Object.keys(categories[categoryName]).length > 0
      );
      
      const initialState: Record<string, boolean> = {};
      validCategories.forEach(categoryName => {
        initialState[categoryName] = true; // Start expanded
      });
      
      setExpandedBranches(initialState);
    }
  }, [isRootNode, organizedData]);
  
  // Auto-expand parent nodes when a child matches the search
  useEffect(() => {
    if (searchTerm && !isPrimitive) {
      // Check if any child node contains the search term
      const hasMatchingChild = isArray 
        ? value.some((item: any) => 
            (typeof item === 'string' && item.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item !== null && typeof item !== 'object' && String(item).toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : Object.entries(value).some(([key, val]) => 
            key.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (typeof val === 'string' && val.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (val !== null && typeof val !== 'object' && String(val).toLowerCase().includes(searchTerm.toLowerCase()))
          );
      
      if (hasMatchingChild || isMatch) {
        setExpanded(true);
      }
    }
  }, [searchTerm, value, isPrimitive, isArray, isMatch]);
  
  // Calculate connection points after render for the hierarchical view
  useEffect(() => {
    if (!isRootNode || !organizedData) return;
    if (!containerRef.current || !rootNodeRef.current) return;
    
    const calculateConnections = () => {
      // Get root node position
      const rootRect = rootNodeRef.current?.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect() || 
                            rootNodeRef.current?.parentElement?.getBoundingClientRect();
      
      if (!rootRect || !containerRect) return;
      
      // Root center coordinates relative to the container
      const rootCenter = {
        x: rootRect.left + rootRect.width / 2 - containerRect.left,
        y: rootRect.bottom - containerRect.top
      };
      
      // Get branch positions
      const branchPositions = Array.from(branchRefsMap.entries())
        .filter(([id, ref]) => {
          // Filter out invalid references and ensure the branch is in the validCategories
          return ref !== null && 
                ref !== undefined && 
                Object.keys(expandedBranches).includes(id);
        })
        .map(([id, ref]) => {
          if (!ref) return { id, x: 0, y: 0, valid: false };
          
          const branchRect = ref.getBoundingClientRect();
          if (!branchRect) return { id, x: 0, y: 0, valid: false };
          
          return {
            id,
            x: branchRect.left + branchRect.width / 2 - containerRect.left,
            y: branchRect.top - containerRect.top,
            valid: true
          };
        })
        .filter(item => item.valid); // Only keep valid connections
      
      setConnections({
        rootCenter,
        branches: branchPositions
      });
    };
    
    // Calculate on mount and window resize
    calculateConnections();
    
    // Add a slight delay to ensure DOM is fully updated
    const timer = setTimeout(calculateConnections, 50);
    
    // Set up ResizeObserver for container
    const resizeObserver = new ResizeObserver(() => {
      calculateConnections();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', calculateConnections);
    
    return () => {
      window.removeEventListener('resize', calculateConnections);
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [isRootNode, organizedData, branchRefsMap, expandedBranches]);

  // NOW SAFE because all hooks are initialized above
  // Early return for very deep coordinate arrays to prevent render issues
  if (isGeoJsonCoordinates && depth > 5) {
    return (
      <div className="flex flex-col" style={{ marginLeft: safeDepth > 0 ? `${safeDepth * 20}px` : '0' }}>
        <div className="flex items-center mt-1">
          <div className="json-tree-node px-3 py-2 rounded-md border border-blue-300">
            <span className="font-mono font-semibold">{name}</span>
            <span className="font-mono ml-2 text-gray-500 text-xs">
              [Complex coordinate array - {Array.isArray(value) ? value.length : 0} items]
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Special rendering for root node using the organized data structure
  if (isRootNode && organizedData) {
    const { basicProps, categories, type } = organizedData;
    const validCategories = Object.entries(categories).filter(([_, value]) => Object.keys(value).length > 0);
    
    return (
      <div className="hierarchy-container" ref={containerRef}>
        {/* Root node showing basic properties - only show if not array type or has properties */}
        {(type !== 'array' || Object.keys(basicProps).length > 0) && (
          <div className={`root-node ${type === 'person' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : ''} ${type === 'array' ? 'flex items-center justify-center' : ''}`} ref={rootNodeRef}>
            {type === 'array' ? (
              <span className="font-mono font-semibold text-blue-500">Array ({value.length} items)</span>
            ) : (
              Object.entries(basicProps).map(([key, val]) => {
                // For address and other nested objects, show a special rendering
                if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                  return (
                    <div key={`nested-${key}`} className="flex flex-col mt-1 w-full">
                      <span className="font-mono font-semibold text-blue-400">{key}:</span>
                      <div className="ml-4 mt-1 bg-white/50 dark:bg-black/20 p-2 rounded w-full">
                        {Object.entries(val).map(([nestedKey, nestedVal]) => (
                          <div key={`nested-${key}-${nestedKey}`} className="flex items-start w-full overflow-hidden">
                            <span className="font-mono font-medium mr-2 text-blue-500 property-name">{nestedKey}:</span>
                            <span 
                              className="font-mono property-value"
                              style={{ color: getNodeColor(nestedVal) }}
                            >
                              {typeof nestedVal === 'string' ? `"${nestedVal}"` : String(nestedVal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={`object-prop-${key}`} className="flex items-start mt-1 w-full overflow-hidden">
                    <span className="font-mono text-blue-400 mr-2 property-name">{key}:</span>
                    <span 
                      className="font-mono property-value"
                      style={{ color: getNodeColor(val) }}
                    >
                      {typeof val === 'string' ? `"${val}"` : String(val)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
        
        {/* SVG for connections */}
        {validCategories.length > 0 && (
          <svg className="tree-connections" width="100%" height="100%" preserveAspectRatio="none">
            {/* Connection from root to each branch */}
            {connections.branches.filter(branch => 
              // Additional filtering to prevent drawing paths with invalid coordinates
              branch.x > 0 && branch.y > 0 && 
              connections.rootCenter.x > 0 && connections.rootCenter.y > 0
            ).map((branch, index) => {
              // Calculate control points for a nicer curve
              const startX = connections.rootCenter.x;
              const startY = connections.rootCenter.y;
              const endX = branch.x;
              const endY = branch.y;
              
              // Skip rendering if any coordinate is invalid
              if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
                return null;
              }
              
              // Distance between points affects the curve
              const distance = Math.abs(endX - startX);
              const midY = (startY + endY) / 2;
              
              return (
                <path 
                  key={`connection-${index}`}
                  className="connector-path"
                  d={`M ${startX} ${startY} 
                     C ${startX} ${midY - 10},
                       ${endX} ${midY - 10}, 
                       ${endX} ${endY}`}
                  style={{
                    strokeDasharray: "5, 5",
                    strokeDashoffset: "0",
                    animation: `dash 3s linear infinite${index % 2 === 0 ? '' : ' reverse'}`,
                    opacity: expandedBranches[branch.id] ? 1 : 0.5
                  }}
                />
              );
            })}
          </svg>
        )}
        
        {/* Branches from root to main categories */}
        <div className="tree-branches">
          {validCategories.map(([categoryName, categoryValue], index) => {
            const isBranchExpanded = expandedBranches[categoryName] ?? true;
            
            return (
              <div key={`branch-${categoryName}`} className="branch">
                <div 
                  ref={branchRefCallback(categoryName)}
                  className={`branch-node ${type === 'person' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : ''} ${type === 'array' && categoryName === 'items' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}`}
                  onClick={() => toggleBranchExpansion(categoryName)}
                >
                  <div className="flex items-center w-full overflow-hidden">
                    <span 
                      className="font-mono font-semibold text-blue-400 truncate"
                    >
                      {type === 'array' && categoryName === 'items' ? 'Array Items' : categoryName}
                    </span>
                    <span className="ml-1 font-mono text-gray-400 text-xs whitespace-nowrap">
                      {`{${Object.keys(categoryValue).length}}`}
                    </span>
                    <div className="w-4 h-4 flex items-center justify-center ml-2 flex-shrink-0">
                      <span className="text-gray-400">
                        {isBranchExpanded ? '▾' : '▸'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Children of this category */}
                {isBranchExpanded && (
                  <div className="branch-children">
                    {Object.entries(categoryValue).map(([key, val]: [string, any]) => {
                      // Special handling for array item objects
                      if (type === 'array' && typeof val === 'object' && val !== null && !Array.isArray(val)) {
                        // Determine if this is a simple object (all values are primitives)
                        const isSimpleObject = Object.values(val).every(v => 
                          v === null || typeof v !== 'object'
                        );
                        
                        if (isSimpleObject) {
                          return (
                            <div key={`array-item-${key}`} className="branch-child-item mt-2 p-3 bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-md">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-blue-500 text-sm">{key}</span>
                              </div>
                              <div className="grid gap-1 mt-2">
                                {Object.entries(val).map(([propKey, propVal]) => (
                                  <div key={`${key}-${propKey}`} className="flex">
                                    <span className="font-mono text-blue-400 text-xs mr-2 property-name">{propKey}:</span>
                                    <span 
                                      className="font-mono text-xs property-value"
                                      style={{ color: getNodeColor(propVal) }}
                                    >
                                      {typeof propVal === 'string' ? `"${propVal}"` : String(propVal)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      }
                      
                      // Special handling for hobbies arrays in the person structure
                      if (type === 'person' && val && typeof val === 'object' && val.hobbies && Array.isArray(val.hobbies)) {
                        return (
                          <div key={`hobbies-${key}`} className="branch-child-item mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded">
                            <div className="font-mono font-semibold text-blue-500 break-words">{key}</div>
                            <div className="mt-2 w-full">
                              {Object.entries(val).map(([friendProp, friendVal]) => {
                                if (friendProp === 'hobbies' && Array.isArray(friendVal)) {
                                  return (
                                    <div key={`hobbies-${key}-${friendProp}`} className="mt-1 w-full">
                                      <span className="font-mono text-blue-400">hobbies:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {friendVal.map((hobby: any, i: number) => (
                                          <span 
                                            key={`hobby-${key}-${friendProp}-${i}`}
                                            className="px-2 py-1 text-xs rounded bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 break-words"
                                          >
                                            {hobby}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div key={`branch-child-${key}`} className="branch-child-item">
                                    <TreeNode 
                                      key={`tree-node-${key}`}
                                      name={key}
                                      value={val}
                                      depth={1}
                                      searchTerm={searchTerm}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={`branch-child-${key}`} className="branch-child-item">
                          <TreeNode 
                            key={`tree-node-${key}`}
                            name={key}
                            value={val}
                            depth={1}
                            searchTerm={searchTerm}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Special rendering for all other nodes
  return (
    <div className="flex flex-col" style={{ marginLeft: depth > 0 ? `${depth * 20}px` : '0' }}>
      <div 
        className="flex items-center mt-1 relative"
        style={{ cursor: hasChildren ? 'pointer' : 'default' }}
      >
        {hasChildren && (
          <div 
            className="mr-1 text-gray-400 cursor-pointer" 
            onClick={toggleExpand}
          >
            {expanded ? '▾' : '▸'}
          </div>
        )}
        
        <div 
          ref={nodeRef}
          className={`json-tree-node px-3 py-2 rounded-md border ${isMatch ? 'ring-2 ring-orange-500 match-highlight' : ''}`}
          style={{ 
            borderColor: 'inherit',
            minWidth: '180px',
            backgroundColor: isMatch ? 'rgba(234, 88, 12, 0.1)' : ''
          }}
          onClick={hasChildren ? toggleExpand : undefined}
          data-node-name={name}
          data-node-type={Array.isArray(value) ? 'array' : typeof value}
        >
          <span 
            className="font-mono font-semibold"
            style={{ color: getNodeColor(value) }}
          >
            {name}
          </span>
          
          {isPrimitive && <ValueDisplay value={value} highlight={searchTerm} />}
          
          {!isPrimitive && (
            <span className="font-mono ml-2 text-gray-500 text-xs">
              {isArray 
                ? `Array(${Object.keys(value).length})` 
                : `Object(${Object.keys(value).length})`
              }
            </span>
          )}
        </div>
      </div>
      
      {hasChildren && (
        <div 
          ref={containerRef}
          className={`json-tree-connector ml-6 border-l pl-4 mt-1 ${shouldGroupChildren ? 'node-group relative' : ''} ${!expanded ? 'collapsed' : ''}`}
          style={{
            borderLeft: '1px solid var(--tree-connector-color, #3B5A97)',
            transition: 'height 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
            height: expanded ? 'auto' : '0px',
            opacity: expanded ? 1 : 0.5,
            overflow: expanded ? 'visible' : 'hidden',
            position: 'relative',
            transformOrigin: 'top',
            minWidth: containerSize?.width ? `${containerSize.width}px` : undefined,
            pointerEvents: expanded ? 'auto' : 'none'
          }}
          data-testid="json-tree-container"
        >
          {shouldGroupChildren && expanded && (
            <span className="node-group-badge">{Object.keys(value).length}</span>
          )}
          
          {expanded && (isArray ? (
            // Render array items
            <>
              {/* Special rendering for arrays containing only primitive values (like hobbies) */}
              {value.length > 0 && 
                value.every((item: any) => item === null || typeof item !== 'object') && 
                name.toLowerCase() === 'hobbies' && (
                <div className="flex flex-wrap gap-1.5 my-1">
                  {value.map((item: any, index: number) => (
                    <span 
                      key={`array-item-${index}`}
                      className="px-2 py-1 text-xs rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 flex items-center"
                      style={{ color: getNodeColor(item) }}
                    >
                      {typeof item === 'string' ? item : String(item)}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Special rendering for coordinates arrays - display as wrapped numbers */}
              {value.length > 0 && 
                value.length <= 10 &&
                value.every((item: any) => typeof item === 'number') && 
                name.toLowerCase() === 'coordinates' && (
                <div className="my-1 break-all">
                  <span className="font-mono text-blue-600 dark:text-blue-400 text-sm">
                    [{value.join(', ')}]
                  </span>
                </div>
              )}
              
              {/* Special rendering for nested coordinates - display the first few with better formatting */}
              {value.length > 0 && 
                value.every((item: any) => Array.isArray(item) && item.every((i: any) => typeof i === 'number')) && 
                name.toLowerCase() === 'coordinates' && (
                <div className="my-1 space-y-1">
                  {value.slice(0, 5).map((coord: number[], index: number) => (
                    <div key={`coord-${index}`} className="break-all">
                      <span className="text-gray-500 text-xs mr-1">[{index}]:</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 text-sm">
                        [{coord.join(', ')}]
                      </span>
                    </div>
                  ))}
                  {value.length > 5 && (
                    <div className="text-gray-500 text-xs pt-1">
                      ... {value.length - 5} more points
                    </div>
                  )}
                </div>
              )}
              
              {/* Default rendering for all other array types */}
              {!(value.length > 0 && 
                (value.every((item: any) => item === null || typeof item !== 'object') && name.toLowerCase() === 'hobbies' ||
                (value.length <= 10 && value.every((item: any) => typeof item === 'number') && name.toLowerCase() === 'coordinates') ||
                (value.every((item: any) => Array.isArray(item) && item.every((i: any) => typeof i === 'number')) && name.toLowerCase() === 'coordinates'))) && 
                value.map((item: any, index: number) => (
                  <TreeNode 
                    key={`array-item-${index}`}
                    name={`[${index}]`}
                    value={item}
                    depth={depth + 1}
                    searchTerm={searchTerm}
                  />
                ))
              }
            </>
          ) : (
            // Render object properties
            Object.entries(value).map(([key, propValue]) => (
              <div key={`obj-wrapper-${key}`}>
                <TreeNode 
                  key={`object-prop-${key}`}
                  name={key}
                  value={propValue}
                  depth={depth + 1}
                  searchTerm={searchTerm}
                />
              </div>
            ))
          ))}
        </div>
      )}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

interface JSONTreeProps {
  jsonData?: any;
  noHeader?: boolean;
  searchTerm?: string;
  currentSearchIndex?: number;
  onSearchResultsUpdate?: (total: number) => void;
}

export function JSONTree({ 
  jsonData, 
  noHeader = false, 
  searchTerm = '', 
  currentSearchIndex = 0,
  onSearchResultsUpdate 
}: JSONTreeProps) {
  const [json, setJson] = useState<any>(null);
  const [searchMatches, setSearchMatches] = useState<HTMLElement[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [containerDimensions, setContainerDimensions] = useState<{width: number, height: number}>({width: 0, height: 0});
  const [zoomInActive, setZoomInActive] = useState(false);
  const [zoomOutActive, setZoomOutActive] = useState(false);
  const [resetActive, setResetActive] = useState(false);
  
  // Keep a stable reference to search matches to prevent unnecessary re-renders
  const stableSearchMatches = useRef<HTMLElement[]>([]);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomLevelRef = useRef<number>(1); // Reference to track current zoom level
  const prevJsonDataRef = useRef<any>(null); // Reference to track previous jsonData prop
  
  // Update container dimensions when it resizes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setContainerDimensions({
          width: offsetWidth,
          height: offsetHeight
        });
      }
    };
    
    // Initial measurement
    updateDimensions();
    
    // Set up ResizeObserver for container
    const resizeObserver = new ResizeObserver(updateDimensions);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Helper function to detect GeoJSON
  const isGeoJson = useCallback((data: any) => {
    return data && 
      typeof data === 'object' && 
      data.type === 'FeatureCollection' && 
      Array.isArray(data.features) &&
      data.features.length > 0 &&
      data.features.every((f: any) => 
        f && typeof f === 'object' && f.type === 'Feature' && 
        f.geometry && typeof f.geometry === 'object' && 
        (f.geometry.type === 'Point' || f.geometry.type === 'Polygon' || 
         f.geometry.type === 'LineString' || f.geometry.type === 'MultiPolygon')
      );
  }, []);
  
  // Initialize with jsonData if provided or use default
  useEffect(() => {
    // Initialize with jsonData if available, otherwise use default
    setJson(jsonData || defaultJson);
    if (jsonData) {
      prevJsonDataRef.current = jsonData;
    }
  }, []);
  
  // Inject CSS styles for search highlighting
  useEffect(() => {
    // Create style element if it doesn't exist
    let styleElement = document.getElementById('json-tree-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'json-tree-styles';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = styles;
    
    return () => {
      // Clean up style element when component unmounts
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);
  
  // Helper functions for zooming
  const handleZoomIn = useCallback(() => {
    if (!transformRef.current) return;
    
    try {
      transformRef.current.zoomIn(0.1); // Specify a smaller step
      
      // Get the updated scale after zoomIn has been called
      const newScale = transformRef.current.state?.scale || 1;
      zoomLevelRef.current = newScale;
      setZoomLevel(newScale);
      
      // Visual feedback
      setZoomInActive(true);
      setTimeout(() => setZoomInActive(false), 200);
    } catch (error) {
      console.warn('Error during zoom in:', error);
    }
  }, [setZoomLevel, setZoomInActive]);
  
  const handleZoomOut = useCallback(() => {
    if (!transformRef.current) return;
    
    try {
      transformRef.current.zoomOut(0.1); // Specify a smaller step
      
      // Get the updated scale after zoomOut has been called
      const newScale = transformRef.current.state?.scale || 1;
      zoomLevelRef.current = newScale;
      setZoomLevel(newScale);
      
      // Visual feedback
      setZoomOutActive(true);
      setTimeout(() => setZoomOutActive(false), 200);
    } catch (error) {
      console.warn('Error during zoom out:', error);
    }
  }, [setZoomLevel, setZoomOutActive]);
  
  const handleResetZoom = useCallback(() => {
    if (!transformRef.current) return;
    
    try {
      transformRef.current.resetTransform();
      
      // Update the zoom level state and ref
      zoomLevelRef.current = 1;
      setZoomLevel(1);
      
      // Visual feedback
      setResetActive(true);
      setTimeout(() => setResetActive(false), 200);
    } catch (error) {
      console.warn('Error during zoom reset:', error);
    }
  }, [setZoomLevel, setResetActive]);
  
  // Add keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't apply shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Enter key to toggle expand/collapse of focused node
      if (e.key === 'Enter') {
        const focusedNode = document.activeElement?.closest('.json-tree-node');
        if (focusedNode) {
          (focusedNode as HTMLElement).click();
          e.preventDefault();
        }
      }
      
      // Ctrl+K to expand all nodes
      if (e.ctrlKey && e.key === 'k') {
        // Use a recursive approach to expand all nodes
        const expandNode = (node: Element) => {
          // Find and click the expand icon if it's collapsed
          const expandCollapseIcon = node.previousElementSibling;
          if (expandCollapseIcon && 
              expandCollapseIcon.textContent === '▸' && 
              expandCollapseIcon.classList.contains('cursor-pointer')) {
            (expandCollapseIcon as HTMLElement).click();
          }
          
          // Find child containers to expand their nodes too
          const childContainer = node.nextElementSibling;
          if (childContainer && childContainer.classList.contains('json-tree-connector')) {
            // After a short delay to allow for the expansion animation
            setTimeout(() => {
              // Find all child nodes and expand them too
              childContainer.querySelectorAll('.json-tree-node').forEach(childNode => {
                expandNode(childNode);
              });
            }, 50);
          }
        };
        
        // Start with all top-level nodes
        document.querySelectorAll('.json-tree-node').forEach(node => {
          // Skip nodes that are deeply nested (to avoid duplicate processing)
          if (!node.closest('.json-tree-connector .json-tree-connector')) {
            expandNode(node);
          }
        });
        
        e.preventDefault();
      }
      
      // Ctrl+J to collapse all nodes
      if (e.ctrlKey && e.key === 'j') {
        // Start from the deepest nested nodes and work backwards
        const allNodes = Array.from(document.querySelectorAll('.json-tree-node'));
        
        // Sort nodes by nesting depth (most deeply nested first)
        const sortedNodes = allNodes.sort((a, b) => {
          const depthA = getNodeDepth(a);
          const depthB = getNodeDepth(b);
          return depthB - depthA; // Descending order (deepest first)
        });
        
        // Process nodes in order of depth
        sortedNodes.forEach(node => {
          const expandCollapseIcon = node.previousElementSibling;
          if (expandCollapseIcon && 
              expandCollapseIcon.textContent === '▾' && 
              expandCollapseIcon.classList.contains('cursor-pointer')) {
            (expandCollapseIcon as HTMLElement).click();
          }
        });
        
        e.preventDefault();
      }
    };
    
    // Helper function to determine node depth
    const getNodeDepth = (node: Element): number => {
      let depth = 0;
      let current = node;
      while (current.parentElement) {
        if (current.parentElement.classList.contains('json-tree-connector')) {
          depth++;
        }
        current = current.parentElement;
      }
      return depth;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Add keyboard shortcuts for zooming
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only apply shortcuts when not typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Ctrl/Cmd + Plus to zoom in (both = and + keys work)
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoomIn();
        return;
      }
      
      // Ctrl/Cmd + Minus to zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
        return;
      }
      
      // Ctrl/Cmd + 0 to reset zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetZoom();
        return;
      }
    };
    
    // Add event listener to the window
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);
  
  // Update json when jsonData changes - with deep equality check
  useEffect(() => {
    // If jsonData is null or undefined, don't update
    if (jsonData === null || jsonData === undefined) return;
    
    try {
      // Check for actual changes to avoid unnecessary re-renders
      const currentJsonStr = JSON.stringify(jsonData);
      const prevJsonStr = prevJsonDataRef.current ? JSON.stringify(prevJsonDataRef.current) : '';
      
      if (currentJsonStr !== prevJsonStr) {
        console.log('JSONTree: jsonData changed, updating...', 
          Array.isArray(jsonData) ? `Array with ${jsonData.length} items` : 
          (isGeoJson(jsonData) ? 'GeoJSON FeatureCollection' : 'Object'));
        setJson(jsonData);
        prevJsonDataRef.current = jsonData;
      }
    } catch (error) {
      console.error('Error processing JSON data:', error);
      setJson(defaultJson);
    }
  }, [jsonData, isGeoJson]);
  
  // Find all search matches and notify parent component
  useEffect(() => {
    // Only proceed if we have a search term
    if (!searchTerm) {
      if (onSearchResultsUpdate) {
        onSearchResultsUpdate(0);
      }
      return;
    }
    
    // Use requestAnimationFrame to ensure DOM is fully rendered
    const rafId = requestAnimationFrame(() => {
      const matches = document.querySelectorAll('.json-tree-node.match-highlight');
      const matchesArray = Array.from(matches) as HTMLElement[];
      
      // Debug log
      console.log(`Found ${matchesArray.length} matches for "${searchTerm}"`);
      
      // Store matches in a stable reference
      stableSearchMatches.current = matchesArray;
      setSearchMatches(matchesArray);
      
      // Notify parent of total matches found
      if (onSearchResultsUpdate) {
        onSearchResultsUpdate(matchesArray.length);
      }
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [searchTerm, onSearchResultsUpdate]);

  // Handle navigation between search results
  useEffect(() => {
    // Only proceed if we have matches and a valid index
    if (stableSearchMatches.current.length === 0 || currentSearchIndex <= 0) {
      return;
    }
    
    // Get current match based on index (using the stable reference)
    const currentIdx = currentSearchIndex - 1;
    const matchesCount = stableSearchMatches.current.length;
    
    // Index validation
    if (currentIdx >= matchesCount) {
      console.warn(`Invalid currentSearchIndex: ${currentSearchIndex}, max is ${matchesCount}`);
      return;
    }
    
    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      // First clear any previous current-match markers
      stableSearchMatches.current.forEach(match => {
        match.classList.remove('current-match');
      });
      
      // Get the current match element
      const currentMatch = stableSearchMatches.current[currentIdx];
      
      // Mark and scroll to current match
      if (currentMatch) {
        console.log(`Highlighting match ${currentSearchIndex}/${matchesCount}`);
        currentMatch.classList.add('current-match');
        currentMatch.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
      }
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [currentSearchIndex]);

  // If json is null (not initialized), show loading or empty state
  if (json === null) {
    return (
      <Card className="h-full flex flex-col rounded-none border-0 shadow-none">
        <CardContent className="p-4 flex-1 flex items-center justify-center bg-white dark:bg-[#0E1117]">
          <div className="text-gray-400 dark:text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col rounded-none border-0 shadow-none">
      {!noHeader && (
        <CardHeader className="px-4 py-2 border-b border-gray-200 dark:border-[#222633] bg-white dark:bg-[#161B26]">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {isGeoJson(json) ? 'GeoJSON Viewer' : 'JSON Tree View'}
            </CardTitle>
            
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <span className="mr-1">Dimensions:</span>
              <span>
                {containerDimensions.width > 0 ? 
                  `${Math.round(containerDimensions.width * zoomLevel)} × ${Math.round(containerDimensions.height * zoomLevel)} px (${Math.round(zoomLevel * 100)}%)` 
                  : 'Loading...'}
              </span>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent 
        ref={containerRef}
        className="p-4 flex-1 bg-white dark:bg-[#0E1117] overflow-hidden tree-container relative" 
        tabIndex={0}
        data-testid="json-tree-container"
      >
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.5}
          maxScale={2}
          limitToBounds={false}
          centerOnInit={true}
          doubleClick={{ disabled: true }}
          panning={{ disabled: false }}
          onZoom={(ref: ReactZoomPanPinchRef) => {
            // Update both the ref and state on zoom
            zoomLevelRef.current = ref.state.scale;
            setZoomLevel(ref.state.scale);
          }}
        >
          {() => (
            <>
              <div className="zoom-controls" style={{ position: 'fixed', bottom: '50px', right: '20px', zIndex: 9999 }}>
                <TooltipProvider>
                  <div className="zoom-controls-horizontal">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className={`h-7 w-7 bg-white dark:bg-[#1A2333] border-gray-200 dark:border-[#2D3748] ${
                            zoomOutActive ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : ''
                          }`}
                          onClick={handleZoomOut}
                        >
                          <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex items-center gap-1">
                          <p>Zoom Out</p>
                          <kbd className="px-1 py-0.5 text-xs bg-gray-800 dark:bg-gray-100 rounded border border-gray-600 dark:border-gray-300 text-gray-300 dark:text-gray-800">Ctrl -</kbd>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`h-7 bg-white dark:bg-[#1A2333] border-gray-200 dark:border-[#2D3748] text-xs ${
                        resetActive ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : ''
                      }`}
                      onClick={handleResetZoom}
                    >
                      {Math.round(zoomLevel * 100)}%
                    </Button>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className={`h-7 w-7 bg-white dark:bg-[#1A2333] border-gray-200 dark:border-[#2D3748] ${
                            zoomInActive ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : ''
                          }`}
                          onClick={handleZoomIn}
                        >
                          <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex items-center gap-1">
                          <p>Zoom In</p>
                          <kbd className="px-1 py-0.5 text-xs bg-gray-800 dark:bg-gray-100 rounded border border-gray-600 dark:border-gray-300 text-gray-300 dark:text-gray-800">Ctrl +</kbd>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
              
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%" }}
              >
                <div className="p-4">
                  <TreeNodeErrorBoundary>
                    {isGeoJson(json) ? (
                      <div className="geojson-container">
                        <div className="flex items-center mb-4">
                          <span className="font-mono font-semibold mr-2 text-green-500">GeoJSON FeatureCollection</span>
                          <span className="font-mono text-gray-500 text-xs">({json.features.length} features)</span>
                        </div>
                        <div className="features-container space-y-4">
                          {json.features.map((feature: any, index: number) => (
                            <div key={`feature-${index}`} className="border-l-2 border-green-300 dark:border-green-700 pl-4 py-3 bg-gray-50 dark:bg-gray-900/20 rounded">
                              <div className="font-mono font-semibold text-green-600 dark:text-green-400 mb-2">Feature {index}</div>
                              <div className="space-y-3">
                                <div className="flex items-center">
                                  <span className="font-mono font-semibold mr-2 text-blue-500">type:</span>
                                  <span className="font-mono text-green-500">&quot;{feature.type}&quot;</span>
                                </div>
                                
                                {/* Properties section */}
                                <div>
                                  <span className="font-mono font-semibold text-blue-500">properties:</span>
                                  <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                    {Object.keys(feature.properties || {}).length === 0 ? (
                                      <span className="text-xs text-gray-500">Empty properties</span>
                                    ) : (
                                      <div className="grid gap-2">
                                        {Object.entries(feature.properties || {}).map(([key, value]) => (
                                          <div key={`prop-${index}-${key}`} className="text-xs">
                                            <span className="font-mono font-medium text-blue-500">{key}:</span>
                                            <span className="font-mono ml-1 break-all">{JSON.stringify(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Geometry section with improved rendering for coordinates */}
                                <div>
                                  <span className="font-mono font-semibold text-blue-500">geometry:</span>
                                  <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center mb-2">
                                      <span className="font-mono font-medium text-blue-500 mr-2">type:</span>
                                      <span className="font-mono text-green-500">&quot;{feature.geometry?.type}&quot;</span>
                                    </div>
                                    
                                    <div>
                                      <span className="font-mono font-medium text-blue-500">coordinates:</span>
                                      <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
                                        {feature.geometry?.type === "Point" ? (
                                          <div className="text-sm font-mono">
                                            <div className="text-gray-500 mb-1">Point coordinates:</div>
                                            <div className="flex flex-wrap items-center">
                                              <span className="text-blue-600 dark:text-blue-400 break-all">
                                                [{feature.geometry.coordinates[0]}, {feature.geometry.coordinates[1]}]
                                              </span>
                                            </div>
                                          </div>
                                        ) : feature.geometry?.type === "Polygon" ? (
                                          <div className="text-sm font-mono">
                                            <div className="mb-1 text-gray-500">
                                              Polygon with {feature.geometry.coordinates[0]?.length || 0} points
                                            </div>
                                            <div className="overflow-auto max-h-36 pr-2 text-gray-700 dark:text-gray-300">
                                              {feature.geometry.coordinates[0]?.slice(0, 5).map((coord: number[], i: number) => (
                                                <div key={`polygon-point-${index}-${i}`} className="mb-1 break-all">
                                                  <span className="text-gray-500 mr-2 inline-block w-7">[{i}]:</span>
                                                  <span className="text-blue-600 dark:text-blue-400 whitespace-normal">
                                                    [{coord[0]}, {coord[1]}]
                                                  </span>
                                                </div>
                                              ))}
                                              {(feature.geometry.coordinates[0]?.length || 0) > 5 && (
                                                <div className="pt-1 text-gray-500 border-t border-gray-200 dark:border-gray-700 mt-1">
                                                  ... {(feature.geometry.coordinates[0]?.length || 0) - 5} more points
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs font-mono text-gray-500">
                                            {feature.geometry?.type} coordinates (complex)
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <TreeNode name="root" value={json} isExpanded={true} searchTerm={searchTerm} />
                    )}
                  </TreeNodeErrorBoundary>
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </CardContent>
    </Card>
  );
} 