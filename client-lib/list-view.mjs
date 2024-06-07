import { View } from '@webhandle/backbone-view'
import Emitter from '@webhandle/minimal-browser-event-emitter'
import DataItemWorker from './data-item-worker.mjs'

let dataItemWorker = new DataItemWorker()

export default class ListView extends View {

	/**
	 * Setup the event listners and default objects.
	 * @param {Object} options 
	 */
	preinitialize(options = {}) {
		this.desktopHandleSelector = options.desktopHandleSelector
		this.mobileHandleSelector = options.mobileHandleSelector || '.handle'
		this.events = Object.assign({}, {
			'drop .': 'handleDrop'
			, 'dragend .': 'handleDragEnd'
			, 'dragleave .': 'handleDragLeave'
			, 'dragover .': 'handleDragover'
			, 'dragenter .': 'dragEnter'
			, 'dragover *': 'dragEnterCell'
			, 'dragstart *': 'dragStart'
			, ['touchstart ' + this.mobileHandleSelector]: 'touchDrag'
			, ['touchmove ' + this.mobileHandleSelector]: 'touchMove'
			, ['touchend ' + this.mobileHandleSelector]: 'touchEnd'
			, ['touchcancel ' + this.mobileHandleSelector]: 'touchCancel'
		}, options.events)
		this.placeholderName = options.placeholderName || 'New Item'
		options.events = this.events
		if (!this.emitter) {
			this.emitter = new Emitter()
		}
		this.overscrollCaptures = {}
	}

	/**
	 * Returns true if a file is being dragged into the list.
	 * @param {Event} evt 
	 * @returns 
	 */
	isFileTypeDrag(evt) {
		if (evt.dataTransfer && evt.dataTransfer.item && evt.dataTransfer.item.length > 0) {
			if (evt.dataTransfer.items[0].kind === 'file') {
				return true
			}
		}
		if (evt.dataTransfer && evt.dataTransfer.types) {
			for (let type of evt.dataTransfer.types) {
				if (type.toLowerCase() == 'files') {
					return true
				}
			}
		}

		return false
	}

	/**
	 * Looks to see if there's a resource label and we should therefore consider this an
	 * external resource object that's being dragged into the list.
	 * @param {Event} evt 
	 * @returns 
	 */
	isResourceTypeDrag(evt) {
		return !!this.extractLabel(evt)
	}

	/**
	 * Watches for entry of dragging into a cell so we can tell of the user is still
	 * performing a drag operation.
	 * @param {Event} evt 
	 * @param {Element} selected 
	 */
	dragEnterCell(evt, selected) {
		this.canCancel = false
	}

	/**
	 * Watch for the end of dragging for one of the existing cells. This is the cleanup
	 * for the case where a user is dragging and then presses escape.
	 * @param {Event} evt 
	 * @param {Element} selected 
	 */
	handleDragEnd(evt, selected) {
		this.cleanupDrag()
	}

	/**
	 * Watches for the mouse leaving the list area. The spec has no good way to tell if the user
	 * has stopped dragging within our control area, so here we're doing a little dance to watch
	 * when the user leaves any of the top level elements and then perform a cancel if we don't
	 * see another drag event within a few milliseconds.
	 * 
	 * This does sometimes lead to false positives, but that's generally okay since the code just
	 * interprets the next drag event as if the user just started their drag, so it recovers 
	 * fairly well.
	 * @param {Event} evt 
	 * @param {Element} selected 
	 */
	handleDragLeave(evt, selected) {
		if (this.externalDrag) {
			if (evt.target == this.el || this.getCells().includes(evt.target)) {
				// so we're leaving the whole list. If we don't immediately enter someplace else
				// then we should interpret this as a cancel
				// In this case, "the whole list" is one of the cells or the container
				this.canCancel = true
				setTimeout(() => {
					if (this.canCancel) {
						this.cleanupDrag()
					}
				}, 20)
			}
		}
	}

	/**
	 * Returns true if this is a type of object from outside the list that can be added
	 * to the list. By default it allows files and uri-list types. To turn off the abilty
	 * to drag other items into the list, just override to return false.
	 * @param {Event} evt 
	 * @returns 
	 */
	shouldInsertCellForExternalDrag(evt) {
		return this.isFileTypeDrag(evt) || this.isResourceTypeDrag(evt)
	}


	/**
	 * This is the mobile/touch equivalent of dragStart
	 * @param {Event} evt 
	 * @param {Element} selected 
	 */
	touchDrag(evt, selected) {
		this.captureOverscroll('html')
		this.captureOverscroll('body')
		this.dragStart(evt, selected)
	}

	/**
	 * Handle the user touch dragging an item.
	 * @param {Event} evt 
	 * @param {Element} selected 
	 */
	touchMove(evt, selected) {
		let top = this.boxTop()
		let pos = Math.max(0, evt.touches[0].pageY) - top
		this.positionOnDrag(pos)
	}

	/**
	 * This is essentially a mobile/touch drop
	 * @param {Event} evt 
	 * @param {Element} selected 
	 */
	touchEnd(evt, selected) {
		this.handleDrop(evt, selected)
	}

	/**
	 * Cleanup after a mobile drag
	 * @param {Event} evt 
	 * @param {Element} selected 
	 */
	touchCancel(evt, selected) {
		this.cleanupDrag()
	}

	/**
	 * Listens for the element being dragged. The spec seems to indicate that this is
	 * fired on mobile as well, but in practice is seems to only get fired on 
	 * desktop.
	 * @param {Event} evt 
	 * @param {Element} selected 
	 */
	dragStart(evt, selected) {
		this.dragging = this.getCellFromChild(selected)
		this.dragging.classList.add('dragging')
		if (evt.dataTransfer) {
			evt.dataTransfer.setDragImage(document.createElement('div'), 0, 0)
		}
	}

	/**
	 * Extracts a placeholder label from the data transfer types. The label name is
	 * part of the type name. So, a type of `data:text/label,awesome` would indicate
	 * that the placeholder is supposed to be `awesome`.
	 * @param {Event} evt 
	 * @returns 
	 */
	extractLabel(evt) {
		let labelPrefix = 'data:text/label,'
		for (let type of evt.dataTransfer.types) {
			if (type.indexOf(labelPrefix) == 0) {
				return type.substring(labelPrefix.length)
			}
		}

		return null
	}

	/**
	 * Restores the elements previous overscroll behavior (see captureOverscroll for why we need
	 * this)
	 * @param {string} elName 
	 */
	restoreOverscroll(elName) {
		if (elName in this.overscrollCaptures) {
			document.querySelector(elName).style['overscroll-behavior'] = this.overscrollCaptures[elName]
			delete this.overscrollCaptures[elName]
		}
	}

	/**
	 * Used for mobile to get the present value of what happens when the user drags their finger
	 * farther than the screen can scroll. By default what happens is a page reload. That won't 
	 * be what we want if a user is dragging a list item, so we have to capture that behavior and
	 * change it so that nothing happens to the page.
	 * @param {string} elName 
	 */
	captureOverscroll(elName) {
		let el = document.querySelector(elName)
		this.overscrollCaptures[elName] = el.style['overscroll-behavior']
		el.style['overscroll-behavior'] = 'none'
	}

	/**
	 * Utility function to create a dom node based on html
	 * @param {string} html 
	 * @returns 
	 */
	_makeElementFromHTML(html) {
		let div = document.createElement('div')
		div.innerHTML = html
		let child = div.children[0]
		return child
	}


	/**
	 * Creates markup for the external drag event placeholder cell. Attempts
	 * to determine a reasonable label.
	 * @param {Event} evt 
	 * @returns 
	 */
	createExternalDragPlaceholderHTML(evt) {
		let placeholder = this.extractLabel(evt) || this.placeholderName
		let html = `<div class="cell">
			<span class="handle">↕</span>
			${placeholder}
		</div>`
		return html

	}

	/**
	 * Creates a placeholder cell for a drag event where the source is an
	 * external object like a file or something else on the page.
	 * @param {Event} evt 
	 */
	createExternalDragPlaceholderCell(evt) {
		let html = this.createExternalDragPlaceholderHTML(evt)
		let cell = this._makeElementFromHTML(html)
		cell.setAttribute('draggable', true)
		this.addCell(cell)
		this.dragStart(evt, cell)
	}

	dragEnter(evt, selected) {
		if (!this.dragging && this.shouldInsertCellForExternalDrag(evt)) {
			// If we're not already doing a drag operation, we need to start one
			// We create a placeholder for this event and then move it up and down
			// like a pre-existing cell. 
			// NOTE: We do not have much information about the contents of the
			// drag until the drop event occurs. This placeholder may have to be
			// somewhat generic.
			this.externalDrag = true
			this.createExternalDragPlaceholderCell(evt)
		}
	}

	/**
	 * Watch for movement of something being dragged
	 * @param {Event} evt 
	 * @param {Element} selected 
	 */
	handleDragover(evt, selected) {
		evt.preventDefault()
		this.canCancel = false
		let top = this.boxTop()
		let pos = evt.y - top

		if (this.dragging) {
			if (evt.dataTransfer) {
				evt.dataTransfer.dropEffect = 'move'
			}
			this.positionOnDrag(pos)
		}
		else {
			if (evt.dataTransfer) {
				evt.dataTransfer.dropEffect = 'copy'
			}
		}
	}

	/**
	 * Creates permanent cells for files dropped into the list
	 * @param {array[FileEntry|File]} files 
	 * @returns an array of Elements
	 */
	createCellsForFiles(files) {
		let cells = files.map(file => {
			let html = `<div class="cell">
				<span class="handle">↕</span>
				${file.name}
			</div>`
			let el = this._makeElementFromHTML(html)
			el.data = file
			return el
		})
		return cells
	}

	/**
	 * Creates permanent cells for resource objects dropped into the list
	 * @param {array[string]} uriList 
	 * @returns an array of Elements
	 */
	createCellsForUriList(uriList) {
		if (!Array.isArray(uriList)) {
			uriList = [uriList]
		}
		let cells = uriList.map(uri => {
			let html = `<div class="cell">
				<span class="handle">↕</span>
				${uri}
			</div>`
			let el = this._makeElementFromHTML(html)
			el.data = uri
			return el
		})
		return cells
	}

	/**
	 * Creates permanent cells for drops of unknown types.
	 * @param {Event} evt 
	 * @returns An array of elements
	 */
	createCellsForUnknownType(evt) {
		return []
	}
	
	isExternalDrop(evt) {
		let uriList
		if (evt.dataTransfer) {
			uriList = evt.dataTransfer.getData('text/uri-list')
		}

		if (this.externalDrag || uriList) {
			return true
		}
		return false
	}
	
	async getFilesEntries(evt) {
		let files = await dataItemWorker.getFileEntriesFromEvent(evt, {
			keepDirectories: false
			, recursive: true
		})
		return files
	}

	/**
	 * Creates permanent cells for external items dropped into the list,
	 * emits events, and does cleaup
	 * @param {Event} evt 
	 * @param {Element} selected 
	 */
	handleDrop(evt, selected) {
		evt.preventDefault()
		
		// Sometimes the placeholder gets cleaned up before the insertion of the new nodes
		// happens. Let's capture the following element just in case we need it.
		let afterDragElement
		if(this.dragging) {
			afterDragElement = this.dragging.nextElementSibling
		}

		let p = new Promise(async (resolve, reject) => {
			if (this.isExternalDrop(evt)) {
				// if a link is dropped, there's no exteralDrag object, just a drop object
				let uriList
				if (evt.dataTransfer) {
					uriList = evt.dataTransfer.getData('text/uri-list')
				}

				let changes = []
				let files = await this.getFilesEntries(evt)
				let cells = []
				if (files && files.length > 0) {
					cells = this.createCellsForFiles(files)
					for (let count = 0; count < cells.length; count++) {
						let cell = cells[count]
						if (!cell.file) {
							cell.file = files[count]
						}
					}
				}
				else if (uriList) {
					if (typeof uriList == 'string') {
						// Acording to the spec, this should be a list with one uri on every line
						// In practice, it seems like the browser is eating the return characters
						// In my tests, I'm passing multiple uris as comma separated. I'm handling
						// both cases here.
						let parts = [uriList]
						for (let sep of ['\r\n', '\n', ',']) {
							let newParts = []
							for (let part of parts) {
								newParts.push(...part.split(sep))
							}
							parts = newParts
						}
						uriList = parts
					}
					cells = this.createCellsForUriList(uriList)
				}
				else {
					cells = this.createCellsForUnknownType(evt)
				}

				for (let cell of cells) {
					cell.setAttribute('draggable', true)
					this.addCell(cell, {
						before: this.dragging || afterDragElement
					})
					changes.push({
						cell: cell
						, file: cell.file
					})
				}
				if (this.dragging) {
					this.dragging.remove()
				}
				this.emitter.emit('list-change', {
					type: 'drop'
					, cells: cells
					, files: files
					, changes: changes
					, event: evt
				})
			}
			else {
				this.emitter.emit('list-change', {
					type: 'reorder'
					, cells: [this.dragging]
				})
			}

		})
		this.cleanupDrag()
		return p
	}

	/**
	 * Adds a new item to the list, last item by default 
	 * @param {string|Element} cell The item to add 
	 * @param {*} [options]
	 * @param {boolean} options.first If true inserted at the start of the list
	 * @param {boolean} options.last If true inserted at the end of the list
	 * @param {Element} options.after Insert after this item 
	 * @param {Element} options.before Insert before this item
	 * @param {*} options.data Data to be set on the element
	 */
	addCell(cell, options = {}) {
		if (typeof cell === 'string') {
			cell = this._makeElementFromHTML(cell)
		}

		if (options.data) {
			cell.data = options.data
		}

		if (options.first) {
			this.el.insertAdjacentElement('afterbegin', cell)
		}
		else if (options.before) {
			this.el.insertBefore(cell, options.before)
		}
		else if (options.after) {
			options.after.after(cell)
		}
		else {
			this.el.insertAdjacentElement('beforeend', cell)
		}
		return cell
	}

	/**
	 * 
	 * @param {int} pos position of pointer relative to the top of the box
	 */
	positionOnDrag(pos) {
		let over = this.findOver(pos)
		this.addCell(this.dragging, {
			before: over
		})
	}

	/**
	 * Gets the top level objects of the list.
	 * @returns 
	 */
	getCells() {
		return [...this.el.children]
	}

	/**
	 * Cleanup after a drag event by deleting any placeholder objects
	 * and restoring the browser to its pre-drag settings
	 */
	cleanupDrag() {
		if (this.dragging && this.externalDrag) {
			this.dragging.remove()
		}

		delete this.dragging
		delete this.externalDrag
		this.getCells().forEach(cell => {
			cell.classList.remove('dragging')
		})
		this.restoreOverscroll('html')
		this.restoreOverscroll('body')
	}

	/**
	 * Determine which cell the pointer/finger is currently over.
	 * @param {Object} pos 
	 * @returns 
	 */
	findOver(pos) {
		let locations = this.findLocations()
		for (let loc of locations) {
			if (pos >= loc.top && pos <= loc.bottom) {
				return loc.cell
			}
		}
	}

	/**
	 * Gets the top of the list box
	 * @returns 
	 */
	boxTop() {
		let boxRect = this.el.getBoundingClientRect()
		let top = boxRect.top
		return top
	}


	/**
	 * Sets up the cells to be draggable and makes the mobile touch handles ready for drag.
	 */
	render() {
		if (this.desktopHandleSelector) {
			this.el.querySelectorAll(this.desktopHandleSelector).forEach(handle => {
				handle.setAttribute("draggable", true)
			})
		}
		else {
			this.getCells().forEach(cell => {
				cell.setAttribute("draggable", true)
			})
		}
		if (this.mobileHandleSelector) {
			this.el.querySelectorAll(this.mobileHandleSelector).forEach(handle => {
				handle.style['touch-action'] = 'none'
			})
		}
	}

	/**
	 * 
	 * @returns The relative locations of the cells in the list
	 */
	findLocations() {
		let top = this.boxTop()

		let locations = []
		this.getCells().forEach(cell => {
			let rect = cell.getBoundingClientRect()
			locations.push({
				top: rect.top - top
				, bottom: rect.bottom - top
				, cell: cell
			})
		})
		return locations
	}

	/**
	 * Give a node for the cell or a descendent of a cell, returns the node
	 * for the cell.
	 * @param {Node} child 
	 * @returns 
	 */
	getCellFromChild(child) {
		if (child.parentElement == this.el) {
			return child
		}
		if (!child) {
			return null
		}
		return this.getCellFromChild(child.parentElement)
	}
}


