import os
from typing import Any, List, Mapping, Optional, Dict
import requests
from langchain_core.language_models.llms import LLM
from langchain_core.callbacks.manager import CallbackManagerForLLMRun
from decouple import config

class LiteLLMCustomLLM(LLM):
    """Custom LLM implementation for LiteLLM proxy"""
    
    base_url: str = config("LITELLM_BASE_URL")
    model_name: str = "bedrock/anthropic.claude-3-5-haiku-20241022-v1:0"  # Using available Bedrock model
    temperature: float = 0.7
    max_tokens: int = 500
    request_timeout: int = 60
    
    @property
    def _llm_type(self) -> str:
        return "litellm-custom"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Call the LiteLLM API with error handling and retries"""
        
        # Use the LiteLLM API key from environment
        api_key = config("LITELLM_API_KEY")
        
        # Debug: Print the API key format (first 10 chars for security)
        print(f"Using API key starting with: {api_key[:10]}...")
        print(f"API key length: {len(api_key)}")
        
        # Use chat/completions endpoint for Bedrock models
        endpoint = f"{self.base_url}/chat/completions"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        # Use messages format for chat completions
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
        
        data = {
            "model": self.model_name,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }
        
        if stop is not None:
            data["stop"] = stop
            
        try:
            print(f"Making API request to {endpoint} with {self.model_name}")
            print(f"Headers: {list(headers.keys())}")
            
            response = requests.post(
                endpoint, 
                headers=headers, 
                json=data,
                timeout=self.request_timeout
            )
            
            # Print status code to help with debugging
            print(f"API response status code: {response.status_code}")
            
            # Print response headers for debugging
            print(f"Response headers: {dict(response.headers)}")
            
            response.raise_for_status()
            
            result = response.json()
            if "choices" in result and len(result["choices"]) > 0:
                content = result["choices"][0]["message"]["content"]
                print(f"API response success: received {len(content)} chars")
                return content
            else:
                error_msg = f"Error: Unexpected response structure: {result}"
                print(error_msg)
                return error_msg
                
        except Exception as e:
            # Log the error for debugging
            print(f"LiteLLM API error: {str(e)}")
            # Return a graceful error message
            return f"Error: Failed to get response from LiteLLM API: {str(e)}"

# Example usage
if __name__ == "__main__":
    llm = LiteLLMCustomLLM()
    response = llm("What is an authentication system?")
    print(response)
