from langchain.tools import BaseTool
from youtubesearchpython import VideosSearch


class YoutubeRecipeTool(BaseTool):
    name: str = "youtube_recipe_search"
    description: str = (
        "Given a meal or recipe name, searches YouTube for the best recipe video. "
        "Returns videoId, url, thumbnail, title, and channel name."
    )

    def _run(self, meal_name: str) -> dict:
        q = f"{meal_name} recipe easy cooking"

        try:
            search = VideosSearch(q, limit=1)
            results = search.result()
        except Exception as e:
            return {"error": f"Search failed: {e}"}

        if not results or not results.get("result"):
            return {"error": f"No YouTube recipe found for: {meal_name}"}

        video = results["result"][0]

        return {
            "videoId":   video.get("id"),
            "url":       video.get("link"),
            "thumbnail": video.get("thumbnails")[0].get("url") if video.get("thumbnails") else "",
            "title":     video.get("title"),
            "channel":   video.get("channel", {}).get("name", "Unknown Channel"),
        }

    async def _arun(self, meal_name: str) -> dict:
        raise NotImplementedError("Use _run; async batch not yet implemented.")