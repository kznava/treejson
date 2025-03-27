'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Editor } from '@/components/Editor';
import { JSONTree } from '@/components/JSONTree';
import { Search, Download, Settings, Share2, HelpCircle, AlignJustify, Code, GitBranch, Sun, Moon, Keyboard, FileJson, PackageIcon, PackageCheck, Users, Database, Github, UserRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { ThemeDetector } from '@/components/ThemeDetector';
import * as htmlToImage from 'html-to-image';

// A simple manual split view implementation instead of using react-resizable-panels
export default function Home() {
  const [jsonData, setJsonData] = useState<any>(null);
  const [isValid, setIsValid] = useState(true);
  const [splitPosition, setSplitPosition] = useState(null as number | null); // Initial position will be calculated
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const jsonTreeRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ total: 0, current: 0 });
  const { theme, setTheme } = useTheme();
  const [showShortcutsMenu, setShowShortcutsMenu] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('package');
  const [isDownloading, setIsDownloading] = useState(false);

  // Add reference to the JSONTree container
  const jsonTreeContainerRef = useRef<HTMLDivElement>(null);

  // Initialize splitPosition based on container width when component mounts
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Default to 20% of container width initially
    setSplitPosition(20);
  }, []);

  const handleJsonChange = useCallback((json: any, valid: boolean) => {
    console.log('JSON changed:', 
      Array.isArray(json) ? `Array with ${json.length} items` : 
      (json && json.type === "FeatureCollection" ? "GeoJSON FeatureCollection" : 
      (json && json.name && json.friends && Array.isArray(json.friends) ? "Person with friends" : 
      (json && json.name && json.lockfileVersion && json.packages ? "Package-lock.json" : 'Object'))), 
      'Valid:', valid);
    
    // Only update the state if we have valid JSON
    if (valid) {
      // For GeoJSON, ensure it's properly formatted
      if (json && json.type === "FeatureCollection" && Array.isArray(json.features)) {
        console.log(`GeoJSON with ${json.features.length} features detected`);
      } 
      // For person with friends structure
      else if (json && json.name && json.friends && Array.isArray(json.friends)) {
        console.log(`Person with ${json.friends.length} friends detected`);
        // Check if the structure has hobbies
        const friendsWithHobbies = json.friends.filter((friend: any) => 
          friend && typeof friend === 'object' && friend.hobbies && Array.isArray(friend.hobbies)
        );
        if (friendsWithHobbies.length > 0) {
          console.log(`${friendsWithHobbies.length} friends have hobbies listed`);
        }
      }
      // For package-lock.json structure
      else if (json && json.name && json.lockfileVersion && json.packages && typeof json.packages === 'object') {
        const packageCount = Object.keys(json.packages).length;
        console.log(`Package-lock.json with ${packageCount} packages detected`);
        
        // Count scoped packages
        const scopedPackages = Object.keys(json.packages).filter(path => path.includes('@'));
        if (scopedPackages.length > 0) {
          console.log(`${scopedPackages.length} scoped packages found`);
        }
      }
      // For user data array
      else if (Array.isArray(json) && json.length > 0 && json.every(item => 
        item && typeof item === 'object' && item.name && item.age && item.city)) {
        console.log(`User data array with ${json.length} users detected`);
        
        // Get unique cities
        const cities = [...new Set(json.map(user => user.city))];
        console.log(`Users are from ${cities.length} different cities: ${cities.join(', ')}`);
      }
      
      // Force a state update to ensure the tree re-renders
      setJsonData(null);
      setTimeout(() => {
        setJsonData(json);
      }, 10);
    } else {
      setJsonData(null);
    }
    
    setIsValid(valid);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!e.target.value) {
      setSearchResults({ total: 0, current: 0 });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults({ total: 0, current: 0 });
  };

  const handleSearchResultsUpdate = useCallback((total: number) => {
    console.log(`Search results updated: ${total} matches found`);
    setSearchResults(prev => {
      // If total changed but we had results before, keep position if possible
      const current = total > 0 
        ? (prev.total > 0 && prev.current <= total ? prev.current : 1) 
        : 0;
      
      return { total, current };
    });
  }, []);

  const navigateToNextResult = useCallback(() => {
    if (searchResults.total <= 1) return;
    
    setSearchResults(prev => {
      const nextIndex = prev.current === prev.total ? 1 : prev.current + 1;
      console.log(`Navigating to next: ${nextIndex}/${prev.total}`);
      return { ...prev, current: nextIndex };
    });
  }, [searchResults.total]);

  const navigateToPrevResult = useCallback(() => {
    if (searchResults.total <= 1) return;
    
    setSearchResults(prev => {
      const prevIndex = prev.current === 1 ? prev.total : prev.current - 1;
      console.log(`Navigating to previous: ${prevIndex}/${prev.total}`);
      return { ...prev, current: prevIndex };
    });
  }, [searchResults.total]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  // Calculate position with percentage-based constraints
  const calculatePosition = (clientX: number) => {
    if (!containerRef.current) return splitPosition ?? 20;
    
    const containerWidth = containerRef.current.clientWidth;
    
    // Calculate percentage directly
    const percentage = (clientX / containerWidth) * 100;
    
    // Apply percentage-based constraints (15% to 30%)
    const minPercentage = 15;
    const maxPercentage = 30;
    
    return Math.max(minPercentage, Math.min(maxPercentage, percentage));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newPosition = calculatePosition(e.clientX);
    setSplitPosition(newPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for mouse move and up when dragging starts
  useEffect(() => {
    if (!isDragging) return;
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const newPosition = calculatePosition(e.clientX);
      setSplitPosition(newPosition);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    // Clean up on unmount or when isDragging changes
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Add keyboard shortcuts for search navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only activate if we have search results and focus is not in the search input
      if (searchResults.total > 0 && document.activeElement?.tagName !== 'INPUT') {
        if (e.key === 'F3' || (e.ctrlKey && e.key === 'n')) {
          e.preventDefault();
          navigateToNextResult();
        } else if ((e.shiftKey && e.key === 'F3') || (e.ctrlKey && e.key === 'p')) {
          e.preventDefault();
          navigateToPrevResult();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchResults.total, navigateToNextResult, navigateToPrevResult]);

  // Add keyboard shortcuts for theme toggle and other features
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T for theme toggle
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
      
      // Ctrl+F to focus search input
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search Node"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Already have F3 and Shift+F3 for search navigation in another useEffect
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [theme, setTheme]);

  // Change JSON template
  const handleTemplateChange = useCallback((template: string) => {
    setSelectedTemplate(template);
    // We'll pass this to the Editor component
  }, []);

  const userDataJson = [
    { "name": "Chris", "age": 23, "city": "New York" },
    { "name": "Emily", "age": 19, "city": "Atlanta" },
    { "name": "Joe", "age": 32, "city": "New York" },
    { "name": "Kevin", "age": 19, "city": "Atlanta" },
    { "name": "Michelle", "age": 27, "city": "Los Angeles" },
    { "name": "Robert", "age": 45, "city": "Manhattan" },
    { "name": "Sarah", "age": 31, "city": "New York" }
  ];

  // Update the handleEditorChange function to handle array JSON input
  const handleEditorChange = useCallback((value: string) => {
    if (!value || value.trim() === '') {
      setJsonData(null);
      setIsValid(true);
      return;
    }

    try {
      const parsedJSON = JSON.parse(value);
      setJsonData(parsedJSON);
      setIsValid(true);
    } catch (e) {
      console.error('Invalid JSON:', e);
      setIsValid(false);
    }
  }, []);

  // Create a new template option for arrays
  const templates = useMemo(() => ({
    empty: {
      name: 'Empty',
      icon: <FileJson size={16} />,
      value: '{}'
    },
    geojson: {
      name: 'GeoJSON',
      icon: <GitBranch size={16} />,
      value: JSON.stringify({
        "type": "FeatureCollection",
        "features": [
          // ... existing GeoJSON
        ]
      }, null, 2)
    },
    package: {
      name: 'Package',
      icon: <PackageIcon size={16} />,
      // ... existing package template
    },
    personal: {
      name: 'Personal',
      icon: <UserRound size={16} />,
      // ... existing personal template  
    },
    array: {
      name: 'Array',
      icon: <Database size={16} />,
      value: JSON.stringify([
        { "name": "Chris", "age": 23, "city": "New York" },
        { "name": "Emily", "age": 19, "city": "Atlanta" },
        { "name": "Joe", "age": 32, "city": "New York" },
        { "name": "Michelle", "age": 27, "city": "Los Angeles" },
        { "name": "Sarah", "age": 31, "city": "New York" }
      ], null, 2)
    },
    youtube: {
      name: 'YouTube JSON',
      icon: <Code size={16} />,
      value: JSON.stringify({
        "kind": "youtube#searchListResponse",
        "etag": "q4ibjmYp1KA3RqMF4jFLl6PBwOg",
        "nextPageToken": "CAUQAA",
        "regionCode": "NL",
        "pageInfo": {
          "totalResults": 1000000,
          "resultsPerPage": 5
        },
        "items": [
          {
            "kind": "youtube#searchResult",
            "etag": "QCsHBifbaernVCbLv8Cu6rAeaDQ",
            "id": {
              "kind": "youtube#video",
              "videoId": "TvWDY4Mm5GM"
            },
            "snippet": {
              "publishedAt": "2023-07-24T14:15:01Z",
              "channelId": "UCwozCpFp9g9x0wAzuFh0hwQ",
              "title": "3 Football Clubs Kylian Mbappe Should Avoid Signing ✍️❌⚽️ #football #mbappe #shorts",
              "description": "",
              "thumbnails": {
                "default": {
                  "url": "https://i.ytimg.com/vi/TvWDY4Mm5GM/default.jpg",
                  "width": 120,
                  "height": 90
                },
                "medium": {
                  "url": "https://i.ytimg.com/vi/TvWDY4Mm5GM/mqdefault.jpg",
                  "width": 320,
                  "height": 180
                },
                "high": {
                  "url": "https://i.ytimg.com/vi/TvWDY4Mm5GM/hqdefault.jpg",
                  "width": 480,
                  "height": 360
                }
              },
              "channelTitle": "FC Motivate",
              "liveBroadcastContent": "none",
              "publishTime": "2023-07-24T14:15:01Z"
            }
          },
          {
            "kind": "youtube#searchResult",
            "etag": "0NG5QHdtIQM_V-DBJDEf-jK_Y9k",
            "id": {
              "kind": "youtube#video",
              "videoId": "aZM_42CcNZ4"
            },
            "snippet": {
              "publishedAt": "2023-07-24T16:09:27Z",
              "channelId": "UCM5gMM_HqfKHYIEJ3lstMUA",
              "title": "Which Football Club Could Cristiano Ronaldo Afford To Buy? 💰",
              "description": "Sign up to Sorare and get a FREE card: https://sorare.pxf.io/NellisShorts Give Soraredata a go for FREE: ...",
              "thumbnails": {
                "default": {
                  "url": "https://i.ytimg.com/vi/aZM_42CcNZ4/default.jpg",
                  "width": 120,
                  "height": 90
                },
                "medium": {
                  "url": "https://i.ytimg.com/vi/aZM_42CcNZ4/mqdefault.jpg",
                  "width": 320,
                  "height": 180
                },
                "high": {
                  "url": "https://i.ytimg.com/vi/aZM_42CcNZ4/hqdefault.jpg",
                  "width": 480,
                  "height": 360
                }
              },
              "channelTitle": "John Nellis",
              "liveBroadcastContent": "none",
              "publishTime": "2023-07-24T16:09:27Z"
            }
          },
          {
            "kind": "youtube#searchResult",
            "etag": "WbBz4oh9I5VaYj91LjeJvffrBVY",
            "id": {
              "kind": "youtube#video",
              "videoId": "wkP3XS3aNAY"
            },
            "snippet": {
              "publishedAt": "2023-07-24T16:00:50Z",
              "channelId": "UC4EP1dxFDPup_aFLt0ElsDw",
              "title": "PAULO DYBALA vs THE WORLD'S LONGEST FREEKICK WALL",
              "description": "Can Paulo Dybala curl a football around the World's longest free kick wall? We met up with the World Cup winner and put him to ...",
              "thumbnails": {
                "default": {
                  "url": "https://i.ytimg.com/vi/wkP3XS3aNAY/default.jpg",
                  "width": 120,
                  "height": 90
                },
                "medium": {
                  "url": "https://i.ytimg.com/vi/wkP3XS3aNAY/mqdefault.jpg",
                  "width": 320,
                  "height": 180
                },
                "high": {
                  "url": "https://i.ytimg.com/vi/wkP3XS3aNAY/hqdefault.jpg",
                  "width": 480,
                  "height": 360
                }
              },
              "channelTitle": "Shoot for Love",
              "liveBroadcastContent": "none",
              "publishTime": "2023-07-24T16:00:50Z"
            }
          },
          {
            "kind": "youtube#searchResult",
            "etag": "juxv_FhT_l4qrR05S1QTrb4CGh8",
            "id": {
              "kind": "youtube#video",
              "videoId": "rJkDZ0WvfT8"
            },
            "snippet": {
              "publishedAt": "2023-07-24T10:00:39Z",
              "channelId": "UCO8qj5u80Ga7N_tP3BZWWhQ",
              "title": "TOP 10 DEFENDERS 2023",
              "description": "SoccerKingz https://soccerkingz.nl Use code: 'ILOVEHOF' to get 10% off. TOP 10 DEFENDERS 2023 Follow us! • Instagram ...",
              "thumbnails": {
                "default": {
                  "url": "https://i.ytimg.com/vi/rJkDZ0WvfT8/default.jpg",
                  "width": 120,
                  "height": 90
                },
                "medium": {
                  "url": "https://i.ytimg.com/vi/rJkDZ0WvfT8/mqdefault.jpg",
                  "width": 320,
                  "height": 180
                },
                "high": {
                  "url": "https://i.ytimg.com/vi/rJkDZ0WvfT8/hqdefault.jpg",
                  "width": 480,
                  "height": 360
                }
              },
              "channelTitle": "Home of Football",
              "liveBroadcastContent": "none",
              "publishTime": "2023-07-24T10:00:39Z"
            }
          },
          {
            "kind": "youtube#searchResult",
            "etag": "wtuknXTmI1txoULeH3aWaOuXOow",
            "id": {
              "kind": "youtube#video",
              "videoId": "XH0rtu4U6SE"
            },
            "snippet": {
              "publishedAt": "2023-07-21T16:30:05Z",
              "channelId": "UCwozCpFp9g9x0wAzuFh0hwQ",
              "title": "3 Things You Didn't Know About Erling Haaland ⚽️🇳🇴 #football #haaland #shorts",
              "description": "",
              "thumbnails": {
                "default": {
                  "url": "https://i.ytimg.com/vi/XH0rtu4U6SE/default.jpg",
                  "width": 120,
                  "height": 90
                },
                "medium": {
                  "url": "https://i.ytimg.com/vi/XH0rtu4U6SE/mqdefault.jpg",
                  "width": 320,
                  "height": 180
                },
                "high": {
                  "url": "https://i.ytimg.com/vi/XH0rtu4U6SE/hqdefault.jpg",
                  "width": 480,
                  "height": 360
                }
              },
              "channelTitle": "FC Motivate",
              "liveBroadcastContent": "none",
              "publishTime": "2023-07-21T16:30:05Z"
            }
          }
        ]
      }, null, 2)
    }
  }), []);

  // New function to download the visible tree
  const downloadVisibleTree = useCallback(async (format: 'png' | 'jpeg' | 'svg') => {
    if (!jsonData) {
      alert('No JSON data to export. Please load some valid JSON first.');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      if (!jsonTreeContainerRef.current) {
        throw new Error('Tree container not found');
      }
      
      const treeContainer = jsonTreeContainerRef.current;
      const expandButtons = treeContainer.querySelectorAll('[aria-expanded="false"]');
      const expandedState: {el: Element, wasExpanded: boolean}[] = [];
      
      expandButtons.forEach(btn => {
        expandedState.push({ el: btn, wasExpanded: false });
        (btn as HTMLElement).click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const options = {
        backgroundColor: theme === 'dark' ? '#0E1117' : '#ffffff',
        width: treeContainer.scrollWidth,
        height: treeContainer.scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '100%',
          height: '100%',
          margin: '0',
          padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        },
        skipFonts: true,
        pixelRatio: 1
      };
      
      let dataUrl: string;
      
      if (format === 'svg') {
        dataUrl = await htmlToImage.toSvg(treeContainer, options);
      } else {
        dataUrl = await htmlToImage.toPng(treeContainer, options);
      }
      
      const link = document.createElement('a');
      link.download = `jsontree-${new Date().toISOString().slice(0, 10)}.${format}`;
      link.href = dataUrl;
      link.click();
      
      expandedState.forEach(({ el, wasExpanded }) => {
        if (!wasExpanded) {
          (el as HTMLElement).click();
        }
      });
      
    } catch (error) {
      console.error('Error capturing tree:', error);
      alert(`Failed to capture tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  }, [jsonData, theme]);

  return (
    <>
      <ThemeDetector />
      <div 
        className="flex flex-col h-screen bg-white dark:bg-[#0E1117] text-gray-800 dark:text-white"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <header className="flex items-center border-b border-gray-200 dark:border-[#222633] px-4 py-2 bg-white dark:bg-[#0E1117]">
          <div className="flex items-center">
            <div 
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => window.location.reload()}
              title="Refresh page"
            >
              <span className="text-orange-500 font-semibold text-xl mr-1">⦿</span>
              <h1 className="text-md font-semibold">JSON Tree</h1>
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-2">
           
            <div className="relative w-64">
              <Input 
                placeholder="Search Node" 
                className="bg-gray-50 dark:bg-[#1A2333] border border-gray-200 dark:border-[#2D3748] h-8 text-sm pl-8 rounded-md"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <Search className="h-4 w-4 absolute left-2 top-2 text-gray-400" />
              {searchTerm && (
                <>
                  {searchResults.total > 0 && (
                    <div className="absolute right-8 top-2 flex items-center space-x-1 text-xs text-gray-400">
                      <button 
                        onClick={navigateToPrevResult} 
                        className="hover:text-orange-500 focus:outline-none disabled:opacity-50 px-1 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-[#1A2333] transition-colors"
                        aria-label="Previous result (Shift+F3)"
                        title="Previous result (Shift+F3)"
                        disabled={searchResults.total <= 1}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18L9 12L15 6" />
                        </svg>
                      </button>
                      <span className={searchResults.total > 1 ? "text-orange-500 font-medium px-1" : ""}>
                        {searchResults.current}/{searchResults.total}
                      </span>
                      <button 
                        onClick={navigateToNextResult} 
                        className="hover:text-orange-500 focus:outline-none disabled:opacity-50 px-1 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-[#1A2333] transition-colors"
                        aria-label="Next result (F3)"
                        title="Next result (F3)"
                        disabled={searchResults.total <= 1}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 6L15 12L9 18" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={clearSearch}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label="Clear search"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-[#1A2333]" disabled={isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white dark:bg-[#1A2333] border border-gray-200 dark:border-[#2D3748] text-gray-700 dark:text-gray-300">
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={() => downloadVisibleTree('png')}
                  disabled={isDownloading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-image">
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                    <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                    <path d="M10 14 L8 12 L6 14"/>
                    <circle cx="14" cy="12" r="2"/>
                    <path d="m7 18 5-5 5 5"/>
                  </svg>
                  <div className="flex flex-col">
                    <span>Download as PNG</span>
                    <span className="text-xs text-green-500 dark:text-green-400">BETA</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={() => downloadVisibleTree('svg')}
                  disabled={isDownloading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file">
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                    <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                    <text x="6.5" y="18" fontSize="6" fill="currentColor">SVG</text>
                  </svg>
                  <div className="flex flex-col">
                    <span>Download as SVG</span>
                    <span className="text-xs text-gray-400">May have compatibility issues</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>     
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-[#1A2333]"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              <Sun className="h-4 w-4 dark:hidden block" />
              <Moon className="h-4 w-4 hidden dark:block" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-[#1A2333]">
             <a href="https://github.com/kznava/treejson" rel="noopener noreferrer" target="_blank"> <Github className="h-4 w-4" /> </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs bg-white dark:bg-[#0E1117] border-gray-200 dark:border-[#2D3748] text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                >
                  <FileJson className="h-4 w-4 text-orange-500" />
                  <span>Templates</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white dark:bg-[#1A2333] border border-gray-200 dark:border-[#2D3748] text-gray-700 dark:text-gray-300">
               
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={() => handleTemplateChange('package')}
                >
                  <PackageIcon className="h-4 w-4" />
                  <span>Package.json</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={() => handleTemplateChange('package-lock')}
                >
                  <PackageCheck className="h-4 w-4" />
                  <span>Package-lock.json</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={() => handleTemplateChange('geojson')}
                >
                  <Database className="h-4 w-4" />
                  <span>GeoJSON</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={() => handleTemplateChange('person')}
                >
                  <Users className="h-4 w-4" />
                  <span>Nested JSON</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={() => handleTemplateChange('userdata')}
                >
                  <UserRound className="h-4 w-4" />
                  <span>JSON Array</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={() => handleTemplateChange('youtube')}
                >
                  <Code className="h-4 w-4" />
                  <span>YouTube JSON</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs bg-white dark:bg-[#0E1117] border-gray-200 dark:border-[#2D3748] text-gray-700 dark:text-gray-300">
                    Shortcuts
                    <Keyboard className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white dark:bg-[#1A2333] border border-gray-200 dark:border-[#2D3748] text-gray-700 dark:text-gray-300">
                  <div className="px-2 py-1.5 text-xs font-semibold text-orange-500">Search</div>
                  <DropdownMenuItem className="flex justify-between text-xs">
                    <span>Find</span>
                    <span className="bg-gray-100 dark:bg-[#222633] px-1.5 py-0.5 rounded">Ctrl+F</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex justify-between text-xs">
                    <span>Next match</span>
                    <span className="bg-gray-100 dark:bg-[#222633] px-1.5 py-0.5 rounded">F3</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex justify-between text-xs">
                    <span>Previous match</span>
                    <span className="bg-gray-100 dark:bg-[#222633] px-1.5 py-0.5 rounded">Shift+F3</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#222633]" />
                  <div className="px-2 py-1.5 text-xs font-semibold text-orange-500">Navigation</div>
                  <DropdownMenuItem className="flex justify-between text-xs">
                    <span>Expand all</span>
                    <span className="bg-gray-100 dark:bg-[#222633] px-1.5 py-0.5 rounded">Ctrl+K</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex justify-between text-xs">
                    <span>Collapse all</span>
                    <span className="bg-gray-100 dark:bg-[#222633] px-1.5 py-0.5 rounded">Ctrl+J</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex justify-between text-xs">
                    <span>Reset zoom</span>
                    <span className="bg-gray-100 dark:bg-[#222633] px-1.5 py-0.5 rounded">Ctrl+0</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex justify-between text-xs">
                    <span>Zoom in</span>
                    <span className="bg-gray-100 dark:bg-[#222633] px-1.5 py-0.5 rounded">Ctrl+</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex justify-between text-xs">
                    <span>Zoom out</span>
                    <span className="bg-gray-100 dark:bg-[#222633] px-1.5 py-0.5 rounded">Ctrl-</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-hidden flex bg-white dark:bg-[#0E1117]" ref={containerRef}>
          {/* Left Panel */}
          <div 
            className="h-full"
            style={{ 
              width: splitPosition ? `${splitPosition}%` : '20%', // Default to 20% when not yet calculated
              minWidth: '15%',
              maxWidth: '30%'
            }}
          >
            <Editor onJsonChange={handleJsonChange} noHeader={true} templateType={selectedTemplate} />
          </div>
          
          {/* Resize Handle */}
          <div 
            className="cursor-col-resize relative w-[5px] h-full bg-gray-200 dark:bg-[#222633] hover:bg-orange-400 dark:hover:bg-orange-400 transition-colors"
            onMouseDown={handleMouseDown}
          >
            <div className={`absolute h-8 w-1 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 rounded bg-gray-400 dark:bg-blue-400 ${isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'} transition-opacity`} />
          </div>
          
          {/* Right Panel */}
          <div 
            className="h-full flex-1"
            ref={jsonTreeRef}
          >
            <div ref={jsonTreeContainerRef}>
              <JSONTree 
                jsonData={jsonData} 
                noHeader={true} 
                searchTerm={searchTerm} 
                currentSearchIndex={searchResults.current}
                onSearchResultsUpdate={handleSearchResultsUpdate}
              />
            </div>
          </div>
        </main>
        <footer className="border-t border-gray-200 dark:border-[#222633] py-1 px-4 flex justify-between items-center bg-white dark:bg-[#0E1117]">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <span className="text-orange-500 font-semibold text-xl mr-1">⦿</span>
              <span className="text-xs text-gray-700 dark:text-gray-300">JSON Tree</span>
            </div>
          </div>
          <div className="flex items-center">
            <a href="https://kznava.dev" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-colors">
              kznava.dev
            </a>
            <span className="text-xs text-gray-500 dark:text-gray-400 mx-2">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">v0.1.0</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 mx-1">(</span>
            <span className="text-xs text-blue-500 dark:text-blue-400">JSON</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mx-1">)</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mx-2">•</span>
            <span className={`text-xs ${isValid ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {isValid ? 'Valid JSON format' : 'Invalid JSON format'}
            </span>
          </div>
      </footer>
    </div>
    </>
  );
}
