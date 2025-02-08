import { useEffect, useState, useRef } from 'react';

type NewsIds = number[]
type News = {
  by: string,
  id: number,
  score: number,
  title: string,
  url: string,
}

const hackerNewsUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty';
const hackerNewsItemUrl = 'https://hacker-news.firebaseio.com/v0/item/'

export default function HackerNews() {
  const [newsIds, setNewsIds] = useState<NewsIds>([])
  const [news, setNews] = useState<News[]>([])
  const isFetchNews = useRef(false)

  async function fetchNewsIds() {
    try {
      const response = await fetch(hackerNewsUrl)
      const data: NewsIds = await response.json()
      if(data && data.length) {
        const top10data = data.slice(0, 10)
        setNewsIds(top10data)
      }
      
    } catch (error) {
      console.error(error)
    }
  }

  async function fetchNews(ids: NewsIds) {
    const newsList: News[] = []
    const newsFetch = ids.map(async(id) => {
      const response = await fetch(`${hackerNewsItemUrl}${id}.json`)
      const data = await response.json()
      return data
    })
    await Promise.allSettled(newsFetch)
      .then((results) => {
        results.forEach(result => {
          if(result.status === 'fulfilled') {
            newsList.push(result.value )
          }
        })
      })
      .catch((error) => {
        console.error('fetchNews', error)
      })
    
    if(newsList.length) {
      setNews(newsList)
    }
  }

  useEffect(() => {
    if(!isFetchNews.current) {
      fetchNewsIds()
      isFetchNews.current = true;
    }
  }, [])

  useEffect(() => {
    if(isFetchNews.current && newsIds.length) {
      fetchNews(newsIds)
    }
  }, [newsIds])
  return (
    <>
      <h3>Hacker News</h3>
      {news.length !== 0 && <ul>
        {news.map((item) =>
          <li key={item.id}>{item.title}</li>
        )}
      </ul>}
    </>
  )
}