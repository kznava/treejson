"use client";

import { useState, useEffect, memo, useRef, useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Code } from "lucide-react";
import { useTheme } from "next-themes";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PackageIcon, PackageCheck, Users, Database, UserRound } from "lucide-react";

// Sample package.json content to match the image
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
    "eslint-config-next": "13.4.7",
    "html-to-image": "1.11.11",
    "jsdom": "22.1.0",
    "lodash.debounce": "^4.0.8",
    "lodash.get": "^4.4.2",
    "lodash.set": "^4.3.2",
    "next": "13.4.7",
    "postcss": "8.4.24",
    "prettier": "^2.8.8",
    "prettier-plugin-tailwindcss": "^0.3.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-zoom-pan-pinch": "^3.1.0",
    "reflow": "^3.1.2",
    "tailwindcss": "3.3.2",
    "typescript": "5.1.6",
    "zxcvbn": "^4.4.2"
  }
};

// Alternative sample JSON for person with friends structure
const personWithFriendsJson = {
  "name": "Chris",
  "age": 23,
  "address": {
    "city": "New York",
    "country": "America"
  },
  "friends": [
    {
      "name": "Emily",
      "hobbies": [ "biking", "music", "gaming" ]
    },
    {
      "name": "John",
      "hobbies": [ "soccer", "gaming" ]
    }
  ]
};

// Sample package-lock.json structure
const packageLockJson = {
  "name": "treejson",
  "version": "0.1.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "node_modules/@alloc/quick-lru": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@alloc/quick-lru/-/quick-lru-5.2.0.tgz",
      "integrity": "sha512-UrcABB+4bUrFABwbluTIBErXwvbsU/V7TZWfmbgJfbkwiBuziS9gxdODUyuiecfdGQ85jglMW6juS3+z5TsKLw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@babel/runtime": {
      "version": "7.26.10",
      "resolved": "https://registry.npmjs.org/@babel/runtime/-/runtime-7.26.10.tgz",
      "integrity": "sha512-2WJMeRQPHKSPemqk/awGrAiuFfzBmOIPXKizAsVhWH9YJqLZ0H+HS4c8loHGgW6utJ3E/ejXQUsiGaQy2NZ9Fw==",
      "license": "MIT",
      "dependencies": {
        "regenerator-runtime": "^0.14.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    }, 
    "node_modules/zod": {
      "version": "3.24.2",
      "resolved": "https://registry.npmjs.org/zod/-/zod-3.24.2.tgz",
      "integrity": "sha512-lY7CDW43ECgW9u1TcT3IoXHflywfVqDYze4waEz812jR/bZ8FHDsl7pFQoSZTz5N+2NqRXs8GBwnAwo3ZNxqhQ==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/colinhacks"
      }
    }
  }
};

// Sample GeoJSON structure for a template
const geoJsonTemplate = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Point",
        "coordinates": [4.483605784808901, 51.907188449679325]
      }
    },
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [3.974369110811523 , 51.907355547778565],
            [4.173944459020191 , 51.86237166892457 ],
            [4.3808076710679416, 51.848867725914914],
            [4.579822414365026 , 51.874487141880024],
            [4.534413416598767 , 51.9495302480326  ],
            [4.365110733567974 , 51.92360787140825 ],
            [4.179550508127079 , 51.97336560819281 ],
            [4.018096293847009 , 52.00236546429852 ],
            [3.9424146309028174, 51.97681895676649 ],
            [3.974369110811523 , 51.907355547778565]
          ]
        ]
      }
    }
  ]
};

// Sample user data array
const userDataTemplate = [
  { "name": "Chris", "age": 23, "city": "New York" },
  { "name": "Emily", "age": 19, "city": "Atlanta" },
  { "name": "Joe", "age": 32, "city": "New York" },
  { "name": "Kevin", "age": 19, "city": "Atlanta" },
  { "name": "Michelle", "age": 27, "city": "Los Angeles" },
  { "name": "Robert", "age": 45, "city": "Manhattan" },
  { "name": "Sarah", "age": 31, "city": "New York" }
];

// After the userDataTemplate, add the YouTubeDataTemplate
// Sample YouTube API response data
const youtubeDataTemplate = {
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
    }
  ]
};

// Custom Monaco theme to better match JSONTree colors
const monacoThemes = {
  dark: {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string', foreground: '0B7D6E' },
      { token: 'number', foreground: '2F5FE0' },
      { token: 'boolean', foreground: 'C92C2C' },
      { token: 'keyword', foreground: '7D2E75' }
    ],
    colors: {
      'editor.background': '#0E1117',
      'editor.foreground': '#D4D4D8',
      'editorLineNumber.foreground': '#3B5A97',
      'editorCursor.foreground': '#E2E8F0',
      'editor.selectionBackground': '#1A2333',
      'editor.lineHighlightBackground': '#1A233350',
      'editorSuggestWidget.background': '#1A2333',
      'editorSuggestWidget.border': '#222633',
      'editorSuggestWidget.selectedBackground': '#1E3A8A'
    }
  },
  light: {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'string', foreground: '0B7D6E' },
      { token: 'number', foreground: '2F5FE0' },
      { token: 'boolean', foreground: 'C92C2C' },
      { token: 'keyword', foreground: '7D2E75' }
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#1F2937',
      'editorLineNumber.foreground': '#9CA3AF',
      'editorCursor.foreground': '#111827',
      'editor.selectionBackground': '#F3F4F6',
      'editor.lineHighlightBackground': '#F9FAFB',
      'editorSuggestWidget.background': '#FFFFFF',
      'editorSuggestWidget.border': '#E5E7EB',
      'editorSuggestWidget.selectedBackground': '#F3F4F6'
    }
  }
};

interface EditorProps {
  onJsonChange?: (json: any, valid: boolean) => void;
  noHeader?: boolean;
  templateType?: string;
}

// Memoized Editor component to reduce re-renders
const EditorContent = memo(({ value, isValid, handleChange, noHeader, setJsonTemplate }: { 
  value: string, 
  isValid: boolean, 
  handleChange: (value: string | undefined) => void,
  noHeader?: boolean,
  setJsonTemplate: (templateType: string) => void
}) => {
  const { theme } = useTheme();
  const [editorMounted, setEditorMounted] = useState(false);
  const [jsonType, setJsonType] = useState('package');
  
  // Define a function to set up editor themes when Monaco is available
  const handleEditorBeforeMount = (monaco: any) => {
    // Register custom themes
    monaco.editor.defineTheme('custom-dark', monacoThemes.dark);
    monaco.editor.defineTheme('custom-light', monacoThemes.light);
  };
  
  const handleEditorDidMount = () => {
    setEditorMounted(true);
  };
  
  // Get the appropriate theme name
  const editorTheme = theme === 'dark' ? 'custom-dark' : 'custom-light';
  
  // Handle template change
  const handleTemplateChange = (type: string) => {
    setJsonType(type);
    setJsonTemplate(type);
  };
  
  return (
    <Card className="h-full flex flex-col rounded-none border-0 shadow-none">
      {!noHeader && (
        <CardHeader className="px-4 py-2 border-b border-gray-200 dark:border-[#222633] flex flex-row items-center bg-white dark:bg-[#161B26]">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">JSON Editor</CardTitle>
          <div className="ml-auto flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs bg-white dark:bg-[#161B26] border-gray-200 dark:border-[#2D3748] text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                >
                  {jsonType === 'person' && <Users className="h-3.5 w-3.5" />}
                  {jsonType === 'package' && <PackageIcon className="h-3.5 w-3.5" />}
                  {jsonType === 'package-lock' && <PackageCheck className="h-3.5 w-3.5" />}
                  {jsonType === 'geojson' && <Database className="h-3.5 w-3.5" />}
                  {jsonType === 'userdata' && <UserRound className="h-3.5 w-3.5" />}
                  {jsonType === 'youtube' && <Code className="h-3.5 w-3.5" />}
                  {jsonType === 'person' && 'Person with Friends'}
                  {jsonType === 'package' && 'Package.json'}
                  {jsonType === 'package-lock' && 'Package-lock.json'}
                  {jsonType === 'geojson' && 'GeoJSON'}
                  {jsonType === 'userdata' && 'User Data'}
                  {jsonType === 'youtube' && 'YouTube JSON'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white dark:bg-[#1A2333] border border-gray-200 dark:border-[#2D3748] text-gray-700 dark:text-gray-300">
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={() => handleTemplateChange('person')}
                >
                  <Users className="h-4 w-4" />
                  <span>Person with Friends</span>
                </DropdownMenuItem>
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
                  onClick={() => handleTemplateChange('userdata')}
                >
                  <UserRound className="h-4 w-4" />
                  <span>User Data</span>
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
            
            {isValid ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-green-600 dark:text-green-400">Valid JSON</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-red-600 dark:text-red-400">Invalid JSON</span>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0 flex-1 overflow-hidden bg-white dark:bg-[#0E1117]">
        <MonacoEditor
          height="100%"
          defaultLanguage="json"
          value={value}
          onChange={handleChange}
          theme={editorTheme}
          beforeMount={handleEditorBeforeMount}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            folding: true,
            lineNumbers: "on",
            wordWrap: "on",
            formatOnPaste: true,
            automaticLayout: true,
            fontSize: 13,
            scrollBeyondLastLine: false,
            fontFamily: "Monaco, 'Courier New', monospace",
            renderLineHighlight: "all",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            bracketPairColorization: {
              enabled: true,
            },
            padding: {
              top: 12,
              bottom: 12
            }
          }}
        />
      </CardContent>
    </Card>
  );
});

EditorContent.displayName = 'EditorContent';

export function Editor({ onJsonChange, noHeader = false, templateType }: EditorProps) {
  // Determine initial template based on templateType prop
  const getInitialTemplate = () => {
    switch (templateType) {
      case 'person':
        return JSON.stringify(personWithFriendsJson, null, 2);
      case 'package':
        return JSON.stringify(defaultJson, null, 2);
      case 'package-lock':
        return JSON.stringify(packageLockJson, null, 2);
      case 'geojson':
        return JSON.stringify(geoJsonTemplate, null, 2);
      case 'userdata':
        return JSON.stringify(userDataTemplate, null, 2);
      case 'youtube':
        return JSON.stringify(youtubeDataTemplate, null, 2);
      default:
        return JSON.stringify(defaultJson, null, 2);
    }
  };

  const [value, setValue] = useState<string>(getInitialTemplate());
  const [isValid, setIsValid] = useState(true);
  const lastValidJsonRef = useRef<any>(defaultJson);
  
  // Function to set a template based on type
  const setJsonTemplate = useCallback((templateType: string) => {
    switch (templateType) {
      case 'person':
        setValue(JSON.stringify(personWithFriendsJson, null, 2));
        break;
      case 'package':
        setValue(JSON.stringify(defaultJson, null, 2));
        break;
      case 'package-lock':
        setValue(JSON.stringify(packageLockJson, null, 2));
        break;
      case 'geojson':
        setValue(JSON.stringify(geoJsonTemplate, null, 2));
        break;
      case 'userdata':
        setValue(JSON.stringify(userDataTemplate, null, 2));
        break;
      case 'youtube':
        setValue(JSON.stringify(youtubeDataTemplate, null, 2));
        break;
      default:
        setValue(JSON.stringify(defaultJson, null, 2));
    }
  }, []);
  
  // Update template when templateType prop changes
  useEffect(() => {
    if (templateType) {
      setJsonTemplate(templateType);
    }
  }, [templateType, setJsonTemplate]);
  
  // Detect if JSON has person with friends structure
  const isPersonWithFriends = useCallback((json: any) => {
    return json && 
      typeof json === 'object' && 
      json.name && 
      json.friends && 
      Array.isArray(json.friends) && 
      json.friends.some((friend: any) => friend && typeof friend === 'object' && friend.hobbies && Array.isArray(friend.hobbies));
  }, []);
  
  // Detect if JSON is a package-lock.json structure
  const isPackageLock = useCallback((json: any) => {
    return json && 
      typeof json === 'object' && 
      json.name && 
      json.lockfileVersion !== undefined && 
      json.packages && 
      typeof json.packages === 'object';
  }, []);
  
  // Fix GeoJSON format if needed
  const ensureValidGeoJson = useCallback((jsonObj: any): any => {
    // If not GeoJSON, return as is
    if (!jsonObj || typeof jsonObj !== 'object' || jsonObj.type !== 'FeatureCollection' || !Array.isArray(jsonObj.features)) {
      return jsonObj;
    }
    
    // Clean up each feature's coordinates if needed
    const cleanedFeatures = jsonObj.features.map((feature: any) => {
      // Skip if no geometry
      if (!feature.geometry) return feature;
      
      try {
        // Ensure properties is at least an empty object
        feature.properties = feature.properties || {};
        
        // For Point coordinates, ensure they're numbers
        if (feature.geometry.type === 'Point' && Array.isArray(feature.geometry.coordinates)) {
          feature.geometry.coordinates = feature.geometry.coordinates.map((c: any) => typeof c === 'string' ? parseFloat(c) : c);
        }
        
        // For Polygon coordinates, ensure proper nesting and number formatting
        if (feature.geometry.type === 'Polygon' && Array.isArray(feature.geometry.coordinates)) {
          feature.geometry.coordinates = feature.geometry.coordinates.map((ring: any) => {
            if (!Array.isArray(ring)) return [];
            return ring.map((point: any) => {
              if (!Array.isArray(point)) return [0, 0];
              return point.map((c: any) => typeof c === 'string' ? parseFloat(c) : c);
            });
          });
        }
      } catch (e) {
        console.warn('Error fixing GeoJSON coordinates', e);
      }
      
      return feature;
    });
    
    return {
      ...jsonObj,
      features: cleanedFeatures
    };
  }, []);
  
  // Ensure person with friends structure is valid
  const ensureValidPersonStructure = useCallback((jsonObj: any): any => {
    // If not person with friends structure, return as is
    if (!isPersonWithFriends(jsonObj)) {
      return jsonObj;
    }
    
    // Clean up friends array if needed
    if (Array.isArray(jsonObj.friends)) {
      const cleanedFriends = jsonObj.friends.map((friend: any) => {
        // Skip if not an object
        if (!friend || typeof friend !== 'object') return friend;
        
        try {
          // Ensure hobbies is an array
          if (friend.hobbies) {
            if (!Array.isArray(friend.hobbies)) {
              friend.hobbies = [String(friend.hobbies)];
            }
            
            // Ensure all hobbies are strings
            friend.hobbies = friend.hobbies.map((hobby: any) => 
              typeof hobby === 'string' ? hobby : String(hobby)
            );
          } else {
            friend.hobbies = [];
          }
        } catch (e) {
          console.warn('Error fixing friend hobbies', e);
        }
        
        return friend;
      });
      
      return {
        ...jsonObj,
        friends: cleanedFriends
      };
    }
    
    return jsonObj;
  }, [isPersonWithFriends]);
  
  // Ensure package-lock.json structure is valid
  const ensureValidPackageLockStructure = useCallback((jsonObj: any): any => {
    // If not package-lock structure, return as is
    if (!isPackageLock(jsonObj)) {
      return jsonObj;
    }
    
    // Ensure packages object exists
    if (!jsonObj.packages || typeof jsonObj.packages !== 'object') {
      jsonObj.packages = {};
    }
    
    // Clean up packages structure if needed
    const cleanedPackages: Record<string, any> = {};
    
    Object.entries(jsonObj.packages).forEach(([path, packageData]: [string, any]) => {
      // Skip if packageData is not an object
      if (!packageData || typeof packageData !== 'object') {
        cleanedPackages[path] = packageData;
        return;
      }
      
      // Ensure version property exists
      if (!packageData.version) {
        packageData.version = "0.0.0";
      }
      
      cleanedPackages[path] = packageData;
    });
    
    return {
      ...jsonObj,
      packages: cleanedPackages
    };
  }, [isPackageLock]);
  
  // Parse JSON and notify parent component with proper error handling
  useEffect(() => {
    try {
      const parsedJson = JSON.parse(value);
      
      // Apply appropriate cleaners based on the JSON type
      let cleanedJson = parsedJson;
      
      // Clean up GeoJSON format if needed
      cleanedJson = ensureValidGeoJson(cleanedJson);
      
      // Clean up person structure if needed
      cleanedJson = ensureValidPersonStructure(cleanedJson);
      
      // Clean up package-lock structure if needed
      cleanedJson = ensureValidPackageLockStructure(cleanedJson);
      
      lastValidJsonRef.current = cleanedJson;
      
      // Special handling based on JSON type
      const isGeoJson = cleanedJson && 
                        cleanedJson.type === "FeatureCollection" && 
                        Array.isArray(cleanedJson.features);
      
      if (isGeoJson) {
        console.log("GeoJSON detected with", cleanedJson.features.length, "features");
      } else if (isPersonWithFriends(cleanedJson)) {
        console.log("Person with friends detected with", cleanedJson.friends.length, "friends");
      } else if (isPackageLock(cleanedJson)) {
        console.log("Package-lock.json detected with", Object.keys(cleanedJson.packages).length, "packages");
      }
      
      onJsonChange?.(cleanedJson, true);
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
      onJsonChange?.(null, false);
    }
  }, [value, onJsonChange, ensureValidGeoJson, ensureValidPersonStructure, ensureValidPackageLockStructure, isPersonWithFriends, isPackageLock]);
  
  const handleChange = (value: string | undefined) => {
    if (value) {
      setValue(value);
      
      // Attempt to parse immediately to update the tree faster
      try {
        const parsedJson = JSON.parse(value);
        // Apply cleaners
        let cleanedJson = ensureValidGeoJson(parsedJson);
        cleanedJson = ensureValidPersonStructure(cleanedJson);
        cleanedJson = ensureValidPackageLockStructure(cleanedJson);
        
        // Log parsing success for debugging
        console.log('Successfully parsed JSON', 
          Array.isArray(cleanedJson) ? `Array with ${cleanedJson.length} items` : 
          (cleanedJson && cleanedJson.type === "FeatureCollection" ? "GeoJSON FeatureCollection" : 
          (isPersonWithFriends(cleanedJson) ? "Person with friends" : 
          (isPackageLock(cleanedJson) ? "Package-lock.json" : 'Object'))));
        
        lastValidJsonRef.current = cleanedJson;
        onJsonChange?.(cleanedJson, true);
        setIsValid(true);
      } catch (error) {
        // If invalid, don't update the last valid JSON
        console.log('Failed to parse JSON:', (error as Error).message);
        setIsValid(false);
        onJsonChange?.(null, false);
      }
    }
  };

  return (
    <EditorContent 
      value={value}
      isValid={isValid}
      handleChange={handleChange}
      noHeader={noHeader}
      setJsonTemplate={setJsonTemplate}
    />
  );
} 