import React from "react"
import { Input } from "antd"

import Button from "@ui/Button"
import Image from "@components/Image"
import { Icons } from "@components/Icons"

import "./GifPicker.less"
import classNames from "classnames"

export const GifItem = ({ item, fav, onClick }) => {
	const { resource_url, metadata } = item

	const [isFav, setIsFav] = React.useState(fav)

	const onClickFav = async () => {
		setIsFav(!isFav)

		await app.cores.api.customRequest({
			url: "/expressions/gif/fav",
			method: "POST",
			data: {
				resource_url: resource_url,
				metadata: metadata,
			},
		})
	}

	return (
		<div
			className={classNames("gif-picker__results__item", {
				fav: isFav,
			})}
		>
			<Button
				className="gif-picker__results__item__fav-btn"
				icon={<Icons.Star />}
				onClick={onClickFav}
			/>
			<Image
				src={resource_url}
				onClick={onClick}
			/>
		</div>
	)
}

const GifPicker = ({ send, close }) => {
	const [inputKeywords, setInputKeywords] = React.useState("")
	const [results, setResults] = React.useState([])
	const [favorites, setFavorites] = React.useState([])

	const doSearch = async () => {
		if (inputKeywords === "") {
			setResults([])
			return
		}

		const response = await app.cores.api.customRequest({
			url: "/expressions/gif/search",
			method: "GET",
			params: {
				keywords: inputKeywords,
			},
		})

		setResults(
			response.data.data.map((item) => {
				return {
					resource_url: item.file?.hd?.gif?.url,
					metadata: {
						id: String(item.id),
						slug: item.slug,
						title: item.title,
					},
				}
			}),
		)
	}

	const doGetFavs = async () => {
		const response = await app.cores.api.customRequest({
			url: "/expressions/gif/fav",
			method: "GET",
		})

		setFavorites((prev) => [...prev, ...response.data])
	}

	const handleClickItem = (item) => {
		send({
			attachments: [
				{
					url: item.resource_url,
					metadata: item.metadata,
				},
			],
		})
		close()
	}

	const handleSearchBoxChange = (e) => {
		if (e.target.value === "") {
			setResults([])
		}

		setInputKeywords(e.target.value)
	}

	React.useEffect(() => {
		doGetFavs()
	}, [])

	const dataSource = (results.length > 0 ? results : favorites) ?? []

	return (
		<>
			<div className="gif-picker">
				<div className="gif-picker__search-box">
					<Input
						placeholder="Search KLIPY"
						value={inputKeywords}
						onChange={handleSearchBoxChange}
						onPressEnter={doSearch}
					/>
				</div>

				<div className="gif-picker__results">
					{dataSource.map((item) => (
						<GifItem
							key={item.resource_url}
							item={item}
							onClick={() => handleClickItem(item)}
							fav={favorites.includes(item)} // TODO: fetch fav status from server
						/>
					))}
				</div>
			</div>
		</>
	)
}

export default GifPicker
