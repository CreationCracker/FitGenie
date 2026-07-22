from langchain.tools import BaseTool
from youtubesearchpython import VideosSearch


class YoutubeTutorialTool(BaseTool):
    name: str = "youtube_tutorial_search"
    description: str = (
        "Given an exercise name, searches YouTube for the best tutorial. "
        "Returns videoId, url, thumbnail, title, and channel name."
    )

    def _run(self, workout: str) -> dict:
        q = f"{workout} exercise proper form tutorial"

        try:
            search = VideosSearch(q, limit=1)
            results = search.result()
        except Exception as e:
            return {"error": f"Search failed: {e}"}

        if not results or not results.get("result"):
            return {"error": f"No YouTube video found for: {workout}"}

        video = results["result"][0]

        return {
            "videoId":   video.get("id"),
            "url":       video.get("link"),
            "thumbnail": video.get("thumbnails")[0].get("url") if video.get("thumbnails") else "",
            "title":     video.get("title"),
            "channel":   video.get("channel", {}).get("name", "Unknown Channel"),
        }

    async def _arun(self, workout: str) -> dict:
        raise NotImplementedError("Use _run; async batch not yet implemented.")
