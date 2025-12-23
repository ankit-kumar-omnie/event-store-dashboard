import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Copy, Download, Eye, EyeOff } from 'lucide-react';

interface EditableJsonViewerProps {
  data: any;
  title?: string;
  onSave?: (data: any) => void;
  readOnly?: boolean;
  maxHeight?: string;
}

const EditableJsonViewer: React.FC<EditableJsonViewerProps> = ({
  data,
  title,
  onSave,
  readOnly = false,
  maxHeight = '400px',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setEditedData(JSON.stringify(data, null, 2));
  }, [data]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleSave = () => {
    try {
      const parsedData = JSON.parse(editedData);
      setError(null);
      setIsEditing(false);
      if (onSave) {
        onSave(parsedData);
      }
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  const handleCancel = () => {
    setEditedData(JSON.stringify(data, null, 2));
    setError(null);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedData);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([editedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'data'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(editedData);
      setEditedData(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(editedData);
      setEditedData(JSON.stringify(parsed));
      setError(null);
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center space-x-2">
          {title && <h4 className="text-sm font-medium text-gray-900">{title}</h4>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-gray-200"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {!readOnly && !isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
              title="Edit JSON"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </button>
          )}
          
          {isEditing && (
            <>
              <button
                onClick={formatJson}
                className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Format JSON"
              >
                Format
              </button>
              <button
                onClick={minifyJson}
                className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Minify JSON"
              >
                Minify
              </button>
              <button
                onClick={handleSave}
                className="flex items-center px-2 py-1 text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                title="Save changes"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                title="Cancel editing"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </button>
            </>
          )}
          
          <button
            onClick={handleCopy}
            className="flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Copy to clipboard"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Download JSON"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}
          
          {isEditing ? (
            <textarea
              value={editedData}
              onChange={(e) => setEditedData(e.target.value)}
              className={`w-full font-mono text-sm border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{ height: maxHeight }}
              placeholder="Enter valid JSON..."
            />
          ) : (
            <pre
              className="w-full font-mono text-sm bg-gray-50 border border-gray-200 rounded-md p-3 overflow-auto whitespace-pre-wrap break-words"
              style={{ maxHeight }}
            >
              {editedData}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default EditableJsonViewer;