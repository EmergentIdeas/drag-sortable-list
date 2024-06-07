
export default class DataItemWorker {

	async getFileFromEntry(entry) {
		let p = new Promise(async (resolve, reject) => {
			try {
				if (entry.file) {
					entry.file(file => {
						file.entry = entry
						resolve(file)
					}, (err) => {
						console.error(err)
						resolve(null)
					})
				}
				else {
					resolve(null)
				}
			}
			catch (e) {
				console.error(e)
				resolve(null)
			}
		})
		return p
	}

	async readDirectoryEntries(entry) {
		let p = new Promise((resolve, reject) => {
			let dirReader = entry.createReader()
			let result = []
			let readThem = () => {
				dirReader.readEntries(async (entries) => {
					try {
						if(entries && entries.length > 0) {
							for (let entry of entries) {
								result.push(entry)
							}
							readThem()
						}
						else {
							resolve(result)
						}
					}
					catch (e) {
						console.error(e)
						resolve(result)
					}
				})
			}
			readThem()
		})
		return p
	}

	/**
	 * 
	 * Takes a list of DataTransferItems and resolves them to FileEntry objects.
	 * 
	 * Note, you can get a real File object by calling `getFileFromEntry`
	 * @param {array[DataTransferItem|File|FileEntry|DirectoryEntry]} entries 
	 * @param {*} [options]
	 * @returns 
	 */
	async expandEntries(entries, options) {
		options = Object.assign({
			keepDirectories: false
			, recursive: true
		}, options)
		let expanded = []
		let target = [...entries]	
		
		while(target.length > 0) {
			
			// You MUST process all of the DataTransferItems first. If you do a directory read
			// it will blank out the information on those items.
			let item = target.shift()
			
			if(item instanceof File) {
				expanded.push(item)
			}
			else if(item.isFile === true && item.isDirectory === false) {
				expanded.push(item)
			}
			else if(item.isFile === false && item.isDirectory === true) {
				let dirEntries = await this.readDirectoryEntries(item)
				if(options.recursive) {
					target.push(...dirEntries)
				}
				else {
					if(!options.keepDirectories) {
						dirEntries = dirEntries.filter(item => item.isFile)
					}
					expanded.push(...dirEntries)
				}
				if(options.keepDirectories) {
					expanded.push(item)
				}
			}
			else if (item.kind === "file") {
				if (item.webkitGetAsEntry) {
					let entry = item.webkitGetAsEntry()
					if (entry) {
						target.push(entry)
					}
				}
				else if(item.getAsFile) {
					target.push(item.getAsFile())
				}
			}
		}
		
		expanded = expanded.filter(item => !!item)
		return expanded
	}

	/**
	 * A utility function to extract the file entries from a file drop event.
	 * @param {Event} evt 
	 * @returns 
	 */
	async getFileEntriesFromEvent(evt, options) {
		let entries = []
		// items is the new interface we should use if that's available
		if (evt.dataTransfer.items) {
			entries.push(...evt.dataTransfer.items)
		} 
		else if(evt.dataTransfer.files) {
			entries.push(...evt.dataTransfer.files)
		}
		let result = await this.expandEntries(entries, options)
		return result.filter(item => !!item)
	}


}