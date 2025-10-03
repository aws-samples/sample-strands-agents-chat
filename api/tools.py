import json
from contextvars import ContextVar

import requests
from strands import tool

from config import TAVILY_API_KEY
from s3 import upload_file_to_s3

# Context variable to store session workspace directory
session_workspace_context: ContextVar[str] = ContextVar("session_workspace_context", default=None)


def create_session_aware_upload_tool(session_workspace_dir: str, x_user_sub: str = None):
    """Create a session-aware upload tool with the session workspace directory"""

    @tool
    def upload_file_to_s3_and_retrieve_s3_url(filepath: str, user_sub: str = None) -> str:
        """Upload the file at session workspace and retrieve the s3 path

        Args:
            filepath: The path to the uploading file
            user_sub: User subscription ID for gallery tracking
        """
        # Use provided user_sub or fall back to the session user_sub
        effective_user_sub = user_sub or x_user_sub
        return upload_file_to_s3(filepath, session_workspace_dir, effective_user_sub)

    return upload_file_to_s3_and_retrieve_s3_url


@tool
def get_weather(location: str, units: str = "metric") -> str:
    """Get current weather information for a specific location
    
    Args:
        location: City name, state/country (e.g., "New York, NY" or "London, UK")
        units: Temperature units - "metric" (Celsius), "imperial" (Fahrenheit), or "kelvin"
    """
    import os
    
    # Get API key from environment variable
    api_key = os.environ.get("OPENWEATHER_API_KEY", "")
    
    if not api_key:
        return "Weather functionality is not available. OpenWeatherMap API key is not configured."
    
    try:
        # OpenWeatherMap Current Weather API
        base_url = "http://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": location,
            "appid": api_key,
            "units": units
        }
        
        response = requests.get(base_url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Extract relevant weather information
            weather_info = {
                "location": f"{data['name']}, {data['sys']['country']}",
                "temperature": data['main']['temp'],
                "feels_like": data['main']['feels_like'],
                "humidity": data['main']['humidity'],
                "pressure": data['main']['pressure'],
                "description": data['weather'][0]['description'].title(),
                "wind_speed": data.get('wind', {}).get('speed', 'N/A'),
                "visibility": data.get('visibility', 'N/A'),
                "units": units
            }
            
            # Format the response
            unit_symbol = "°C" if units == "metric" else "°F" if units == "imperial" else "K"
            wind_unit = "m/s" if units == "metric" else "mph" if units == "imperial" else "m/s"
            
            weather_report = f"""
Current Weather for {weather_info['location']}:
🌡️ Temperature: {weather_info['temperature']}{unit_symbol} (feels like {weather_info['feels_like']}{unit_symbol})
🌤️ Conditions: {weather_info['description']}
💧 Humidity: {weather_info['humidity']}%
🌬️ Wind Speed: {weather_info['wind_speed']} {wind_unit}
📊 Pressure: {weather_info['pressure']} hPa
👁️ Visibility: {weather_info['visibility']} meters
"""
            return weather_report.strip()
            
        elif response.status_code == 404:
            return f"Location '{location}' not found. Please check the spelling and try again."
        else:
            return f"Weather service error: {response.status_code} - {response.text}"
            
    except requests.exceptions.Timeout:
        return "Weather service request timed out. Please try again."
    except requests.exceptions.RequestException as e:
        return f"Error connecting to weather service: {str(e)}"
    except Exception as e:
        return f"Unexpected error getting weather data: {str(e)}"


@tool
def get_weather_forecast(location: str, days: int = 5, units: str = "metric") -> str:
    """Get weather forecast for a specific location
    
    Args:
        location: City name, state/country (e.g., "New York, NY" or "London, UK")
        days: Number of days for forecast (1-5)
        units: Temperature units - "metric" (Celsius), "imperial" (Fahrenheit), or "kelvin"
    """
    import os
    
    # Get API key from environment variable
    api_key = os.environ.get("OPENWEATHER_API_KEY", "")
    
    if not api_key:
        return "Weather forecast functionality is not available. OpenWeatherMap API key is not configured."
    
    # Limit days to reasonable range
    days = max(1, min(days, 5))
    
    try:
        # OpenWeatherMap 5-day forecast API
        base_url = "http://api.openweathermap.org/data/2.5/forecast"
        params = {
            "q": location,
            "appid": api_key,
            "units": units,
            "cnt": days * 8  # 8 forecasts per day (every 3 hours)
        }
        
        response = requests.get(base_url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            unit_symbol = "°C" if units == "metric" else "°F" if units == "imperial" else "K"
            
            forecast_report = f"Weather Forecast for {data['city']['name']}, {data['city']['country']}:\n\n"
            
            # Group forecasts by day
            from datetime import datetime
            current_date = None
            
            for item in data['list'][:days * 8]:
                forecast_time = datetime.fromtimestamp(item['dt'])
                forecast_date = forecast_time.strftime('%Y-%m-%d')
                
                # Only show one forecast per day (around noon)
                if forecast_date != current_date and forecast_time.hour >= 12:
                    current_date = forecast_date
                    
                    temp = item['main']['temp']
                    temp_min = item['main']['temp_min']
                    temp_max = item['main']['temp_max']
                    description = item['weather'][0]['description'].title()
                    humidity = item['main']['humidity']
                    
                    day_name = forecast_time.strftime('%A, %B %d')
                    
                    forecast_report += f"📅 {day_name}:\n"
                    forecast_report += f"   🌡️ {temp}{unit_symbol} (Low: {temp_min}{unit_symbol}, High: {temp_max}{unit_symbol})\n"
                    forecast_report += f"   🌤️ {description}\n"
                    forecast_report += f"   💧 Humidity: {humidity}%\n\n"
            
            return forecast_report.strip()
            
        elif response.status_code == 404:
            return f"Location '{location}' not found. Please check the spelling and try again."
        else:
            return f"Weather forecast service error: {response.status_code} - {response.text}"
            
    except requests.exceptions.Timeout:
        return "Weather forecast service request timed out. Please try again."
    except requests.exceptions.RequestException as e:
        return f"Error connecting to weather forecast service: {str(e)}"
    except Exception as e:
        return f"Unexpected error getting weather forecast: {str(e)}"


@tool
def web_search(keyword: str) -> str:
    """Search web by using Tavily API

    Args:
        keyword: Search word
    """

    if len(TAVILY_API_KEY) == 0:
        return "Web search functionality is not available because there is no API Key."

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TAVILY_API_KEY}",
    }

    body = {
        "query": keyword,
        "search_depth": "basic",
        "include_answer": False,
        "include_images": False,
        "include_raw_content": True,
        "max_results": 5,
    }

    res = requests.post(
        "https://api.tavily.com/search",
        data=json.dumps(body, ensure_ascii=False),
        headers=headers,
    )

    return res.text
