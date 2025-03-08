# challenges.py

## Description
A script to inspect and convert challenges.json from [game data](https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/challenges.json) to challenges.lua, for use on the League of Legends Wiki.

## Usage
1. Install [Lua](https://www.lua.org/download.html)
    * Ensure the lua binary is accessible via terminal command `lua` in your working directory
2. Install [Python](https://www.python.org/downloads/)
3. (Optional) Start [venv](https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments/)
4. Run in terminal
    ```
    python -m pip install -r requirements.txt
    python challenges.py challenges.json
    ```
