import json
import os

import requests
from langchain.tools import tool

# Import the workspace path functions from file_write.py
from tools.file_write import get_workspace_path, set_workspace_path

class DirWriteTool:
    def __init__(self):
        pass
        
    def run(self, directory_path):
        """Useful to create a directory with the given path."""
        try:
            # Get the current workspace path
            workspace_path = get_workspace_path()
            
            # If we have a workspace_path and directory_path is not an absolute path, prepend the workspace_path
            if workspace_path and not os.path.isabs(directory_path):
                directory_path = os.path.join(workspace_path, directory_path)
                print(f"Using workspace path: {workspace_path} for directory: {directory_path}")
            
            if not os.path.exists(directory_path):
                os.makedirs(directory_path)
                return f"Directory '{directory_path}' has been created successfully."
            else:
                return f"Directory '{directory_path}' already exists."
        except Exception as e:
            return f"Error creating directory: {str(e)}"

# Create an instance of the tool that can be imported directly
dir_write_tool = tool("Create directory")(DirWriteTool().run)
