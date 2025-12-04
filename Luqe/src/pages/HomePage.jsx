import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function HomePage() {
	const [news, setNews] = useState([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetch('/api/news?limit=5')
			.then(res => res.json())
			.then(data => {
				setNews(data)
				setLoading(false)
			})
			.catch(err => {
				console.error('Failed to fetch news:', err)
				setLoading(false)
			})
	}, [])

	return (
		<div className="homepage">
			<div className="homepage-hero">
				<h1>ISS Yemen Community Club</h1>
				<p>Welcome to our community portal</p>
				<div style={{ marginTop: '24px' }}>
					<Link to="/login" className="homepage-btn">Admin Login</Link>
				</div>
			</div>

			{!loading && news.length > 0 && (
				<div className="homepage-content">
					<h2 className="homepage-section-title">Latest News</h2>
					<div className="news-list">
						{news.map(item => (
							<article key={item._id || item.id} className="news-card">
								<div className="news-header">
									<h3 className="news-title">{item.title}</h3>
									<div className="news-meta">
										<span className="news-author">By {item.author}</span>
										<span className="news-date">
											{new Date(item.publishDate).toLocaleDateString('en-GB', {
												year: 'numeric',
												month: 'long',
												day: 'numeric'
											})}
										</span>
									</div>
								</div>
								<div className="news-body">{item.body}</div>
							</article>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

