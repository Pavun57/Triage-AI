import json
import os

import requests
from langchain.tools import tool

# Global variable to store the current workspace path
_current_workspace_path = None

def set_workspace_path(path):
    """Set the current workspace path for file operations"""
    global _current_workspace_path
    _current_workspace_path = path
    print(f"Set workspace path to: {path}")

def get_workspace_path():
    """Get the current workspace path"""
    return _current_workspace_path

class FileWriteTool:
    def __init__(self):
        pass
        
    def run(self, filename, content):
        """Useful to write content to a file with the given filename."""
        try:
            # Get the current workspace path
            workspace_path = get_workspace_path()
            
            # If we have a workspace_path and filename is not an absolute path, prepend the workspace_path
            if workspace_path and not os.path.isabs(filename):
                filename = os.path.join(workspace_path, filename)
                print(f"Using workspace path: {workspace_path} for file: {filename}")
            
            # Create directories if they don't exist
            os.makedirs(os.path.dirname(filename), exist_ok=True)
            
            # Write the content to the file
            with open(filename, 'w', encoding='utf-8') as file:
                file.write(content)
            return f"File '{filename}' has been written successfully."
        except Exception as e:
            return f"Error writing file: {str(e)}"

# Create an instance of the tool that can be imported directly
file_write_tool = tool("Write file")(FileWriteTool().run)
