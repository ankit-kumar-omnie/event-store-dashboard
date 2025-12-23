import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  collapsed?: boolean;
  name?: string;
  level?: number;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ 
  data, 
  collapsed = false, 
  name, 
  level = 0 
}) => {
  const renderValue = (value: any, key?: string, currentLevel: number = level): React.ReactNode => {
    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className="text-blue-600">{value.toString()}</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="text-green-600">{value}</span>;
    }
    
    if (typeof value === 'string') {
      return <span className="text-red-600">"{value}"</span>;
    }
    
    if (Array.isArray(value)) {
      return (
        <ArrayViewer 
          array={value} 
          name={key} 
          level={currentLevel}
          collapsed={currentLevel > 2}
        />
      );
    }
    
    if (typeof value === 'object') {
      return (
        <ObjectViewer 
          object={value} 
          name={key} 
          level={currentLevel}
          collapsed={currentLevel > 2}
        />
      );
    }
    
    return <span>{String(value)}</span>;
  };
  
  return (
    <div className="font-mono text-sm">
      {renderValue(data, name, level)}
    </div>
  );
};

const ObjectViewer: React.FC<{
  object: Record<string, any>;
  name?: string;
  level: number;
  collapsed?: boolean;
}> = ({ object, name, level, collapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const keys = Object.keys(object);
  const indent = level * 20;
  
  return (
    <div>
      <div 
        className="flex items-center cursor-pointer hover:bg-gray-100 rounded px-1"
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {keys.length > 0 && (
          isCollapsed ? 
            <ChevronRight className="h-3 w-3 text-gray-400 mr-1" /> :
            <ChevronDown className="h-3 w-3 text-gray-400 mr-1" />
        )}
        {name && <span className="text-blue-800 mr-2">{name}:</span>}
        <span className="text-gray-600">
          {isCollapsed ? `{...} (${keys.length} ${keys.length === 1 ? 'key' : 'keys'})` : '{'}
        </span>
      </div>
      
      {!isCollapsed && (
        <div>
          {keys.map((key, index) => (
            <div key={key} style={{ paddingLeft: `${indent + 20}px` }} className="py-0.5">
              <span className="text-purple-600">"{key}"</span>
              <span className="text-gray-600 mx-1">:</span>
              <span className="inline-block">
                {typeof object[key] === 'object' && object[key] !== null ? (
                  <JsonViewer 
                    data={object[key]} 
                    level={level + 1}
                    collapsed={level > 1}
                  />
                ) : (
                  <JsonViewer data={object[key]} level={level + 1} />
                )}
              </span>
              {index < keys.length - 1 && <span className="text-gray-600">,</span>}
            </div>
          ))}
          <div style={{ paddingLeft: `${indent}px` }} className="text-gray-600">{'}'}</div>
        </div>
      )}
    </div>
  );
};

const ArrayViewer: React.FC<{
  array: any[];
  name?: string;
  level: number;
  collapsed?: boolean;
}> = ({ array, name, level, collapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const indent = level * 20;
  
  return (
    <div>
      <div 
        className="flex items-center cursor-pointer hover:bg-gray-100 rounded px-1"
        style={{ paddingLeft: `${indent}px` }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {array.length > 0 && (
          isCollapsed ? 
            <ChevronRight className="h-3 w-3 text-gray-400 mr-1" /> :
            <ChevronDown className="h-3 w-3 text-gray-400 mr-1" />
        )}
        {name && <span className="text-blue-800 mr-2">{name}:</span>}
        <span className="text-gray-600">
          {isCollapsed ? `[...] (${array.length} ${array.length === 1 ? 'item' : 'items'})` : '['}
        </span>
      </div>
      
      {!isCollapsed && (
        <div>
          {array.map((item, index) => (
            <div key={index} style={{ paddingLeft: `${indent + 20}px` }} className="py-0.5">
              <span className="text-gray-500 mr-2">{index}:</span>
              <span className="inline-block">
                <JsonViewer 
                  data={item} 
                  level={level + 1}
                  collapsed={level > 1}
                />
              </span>
              {index < array.length - 1 && <span className="text-gray-600">,</span>}
            </div>
          ))}
          <div style={{ paddingLeft: `${indent}px` }} className="text-gray-600">{']'}</div>
        </div>
      )}
    </div>
  );
};

export default JsonViewer;