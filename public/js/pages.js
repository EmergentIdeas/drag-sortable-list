/******/ var __webpack_modules__ = ({

/***/ "./client-lib/list-view.mjs":
/*!**********************************!*\
  !*** ./client-lib/list-view.mjs ***!
  \**********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ListView)
/* harmony export */ });
/* harmony import */ var _webhandle_backbone_view__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @webhandle/backbone-view */ "./node_modules/@webhandle/backbone-view/client-js/index.js");
/* harmony import */ var _webhandle_minimal_browser_event_emitter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @webhandle/minimal-browser-event-emitter */ "./node_modules/@webhandle/minimal-browser-event-emitter/client-js/index.js");



class ListView extends _webhandle_backbone_view__WEBPACK_IMPORTED_MODULE_0__.View {

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
			this.emitter = new _webhandle_minimal_browser_event_emitter__WEBPACK_IMPORTED_MODULE_1__["default"]()
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
		if(evt.dataTransfer && evt.dataTransfer.types) {
			for(let type of evt.dataTransfer.types) {
				if(type.toLowerCase() == 'files') {
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
		if(this.externalDrag) {
			if(evt.target == this.el || this.getCells().includes(evt.target)) {
				// so we're leaving the whole list. If we don't immediately enter someplace else
				// then we should interpret this as a cancel
				// In this case, "the whole list" is one of the cells or the container
				this.canCancel = true
				setTimeout(() => {
					if(this.canCancel) {
						this.cleanupDrag()
					}
				}, 20)
			}
		}
	}
	
	/**
	 * A utility function to extract the files from a file drop event.
	 * @param {Event} evt 
	 * @returns 
	 */
	_getFilesFromEvent(evt) {
		let files = []

		// items is the new interface we should use if that's available
		if (evt.dataTransfer.items) {
			let foundItems = [];
			[...evt.dataTransfer.items].forEach((item, i) => {
				foundItems.push(item)
			})
			for (let item of foundItems) {
				if (item.kind === "file") {
					if (item.webkitGetAsEntry) {
						let entry = item.webkitGetAsEntry()
						if (entry) {
							// if there's no entry, it's probably not a file, so we'll just ignore
							if (entry.isDirectory) {
								continue

								// Evenually we'll want to handle directories too, but for now we'll just go
								// on with the other items

								// var dirReader = entry.createReader()
								// dirReader.readEntries(function (entries) {
								// 	console.log(entries)
								// })
							}
						}
					}
					files.push(item.getAsFile())
				}
				else if (item instanceof File) {
					// Maybe from a file input element
					files.push(item)
				}
			}
		} else {
			[...evt.dataTransfer.files].forEach((file, i) => {
				files.push(file)
			})
		}
		return files.filter(file => !!file)
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
		if(evt.dataTransfer) {
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
			if(type.indexOf(labelPrefix) == 0) {
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
		if(elName in this.overscrollCaptures) {
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
		this.el.appendChild(cell)
		this.dragStart(evt, cell)
	}

	dragEnter(evt, selected) {
		if(!this.dragging && this.shouldInsertCellForExternalDrag(evt)) {
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

		if(this.dragging) {
			if(evt.dataTransfer) {
				evt.dataTransfer.dropEffect = 'move'
			}
			this.positionOnDrag(pos)
		}
		else {
			if(evt.dataTransfer) {
				evt.dataTransfer.dropEffect = 'copy'
			}
		}
	}
	
	/**
	 * Creates permanent cells for files dropped into the list
	 * @param {array} files 
	 * @returns an array of Elements
	 */
	createCellsForFiles(files) {
		let names = files.map(file => file.name)
		let cells = names.map(name => {
			let html = `<div class="cell">
				<span class="handle">↕</span>
				${name}
			</div>`
			return this._makeElementFromHTML(html)
		})
		return cells
	}
	
	/**
	 * Creates permanent cells for resource objects dropped into the list
	 * @param {array[string]} uriList 
	 * @returns 
	 */
	createCellsForUriList(uriList) {
		if(!Array.isArray(uriList)) {
			uriList = [uriList]
		}
		let cells = uriList.map(name => {
			let html = `<div class="cell">
				<span class="handle">↕</span>
				${name}
			</div>`
			return this._makeElementFromHTML(html)
		})
		return cells
	}

	/**
	 * Creates permanent cells for drops of unknown types.
	 * @param {Event} evt 
	 * @returns 
	 */
	createCellsForUnknownType(evt) {
		return []
	}
	
	/**
	 * Creates permanent cells for external items dropped into the list,
	 * emits events, and does cleaup
	 * @param {Event} evt 
	 * @param {Element} selected 
	 */
	handleDrop(evt, selected) {
		evt.preventDefault()

		let uriList
		if(evt.dataTransfer) {
			uriList = evt.dataTransfer.getData('text/uri-list')
		}
		
		if(this.externalDrag) {
			let changes = []
			let files = this._getFilesFromEvent(evt)
			let cells = []
			if(files && files.length > 0) {
				cells = this.createCellsForFiles(files)
				for(let count = 0; count < cells.length; count++) {
					let cell = cells[count]
					if(!cell.file) {
						cell.file = files[count]
					}
				}
			}
			else if(uriList) {
				if(typeof uriList == 'string') {
					// Acording to the spec, this should be a list with one uri on every line
					// In practice, it seems like the browser is eating the return characters
					// In my tests, I'm passing multiple uris as comma separated. I'm handling
					// both cases here.
					let parts = [uriList]
					for(let sep of ['\r\n', '\n', ',']) {
						let newParts = []
						for(let part of parts) {
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

			for(let cell of cells) {
				cell.setAttribute('draggable', true)
				this.el.insertBefore(cell, this.dragging)
				changes.push({
					cell: cell
					, file: cell.file
				})
			}
			this.dragging.remove()
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
		this.cleanupDrag()
	}

	/**
	 * 
	 * @param {int} pos position of pointer relative to the top of the box
	 */
	positionOnDrag(pos) {
		let over = this.findOver(pos)

		if (!over) {
			// it's in the blank space at the end
			this.el.appendChild(this.dragging)
		}
		else if (over != this.dragging) {
			this.el.insertBefore(this.dragging, over)
		}
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
		if(this.dragging && this.externalDrag) {
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
		if(this.desktopHandleSelector) {
			this.el.querySelectorAll(this.desktopHandleSelector).forEach(handle => {
				handle.setAttribute("draggable", true)
			})
		}
		else {
			this.getCells().forEach(cell => {
				cell.setAttribute("draggable", true)
			})
		}
		if(this.mobileHandleSelector) {
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
		if(child.parentElement == this.el) {
			return child
		}
		if(!child) {
			return null
		}
		return this.getCellFromChild(child.parentElement)
	}
}




/***/ }),

/***/ "./node_modules/@webhandle/backbone-view/client-js/event-entry-mapper.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/@webhandle/backbone-view/client-js/event-entry-mapper.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ eventEntryMapper)
/* harmony export */ });
function eventEntryMapper([key, value]) {
	key = key.trim()
	let parts = key.split(' ')
	let event = parts.shift().trim()
	let selector = parts.join(' ').trim()
	
	if(typeof value === 'string') {
		value = value.trim()
	}	
	
	return {
		event: event,
		selector: selector,
		handler: value
	}
}

/***/ }),

/***/ "./node_modules/@webhandle/backbone-view/client-js/extract-event-names.js":
/*!********************************************************************************!*\
  !*** ./node_modules/@webhandle/backbone-view/client-js/extract-event-names.js ***!
  \********************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ extractEventNames)
/* harmony export */ });
function extractEventNames(eventTriggers) {
	let eventNames = Array.from(eventTriggers.reduce((acc, trigger) => {
		acc.add(trigger.event)
		return acc
	}, new Set()))
	return eventNames
}

/***/ }),

/***/ "./node_modules/@webhandle/backbone-view/client-js/generate-id.js":
/*!************************************************************************!*\
  !*** ./node_modules/@webhandle/backbone-view/client-js/generate-id.js ***!
  \************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ generateId)
/* harmony export */ });
/**
 * Generates a random string id in the browser. Will probably not work
 * on the server.
 * @returns A base64 web url safe string
 */
function generateId() {
	let array = new Uint8Array(32)
	window.crypto.getRandomValues(array)
	let value = btoa(array)
	value = value.replace(/\//g, "_").replace(/\+/g, "-").replace(/=+$/, "")
	return value
}

/***/ }),

/***/ "./node_modules/@webhandle/backbone-view/client-js/index.js":
/*!******************************************************************!*\
  !*** ./node_modules/@webhandle/backbone-view/client-js/index.js ***!
  \******************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   View: () => (/* reexport safe */ _view_js__WEBPACK_IMPORTED_MODULE_0__.View)
/* harmony export */ });
/* harmony import */ var _view_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./view.js */ "./node_modules/@webhandle/backbone-view/client-js/view.js");




/***/ }),

/***/ "./node_modules/@webhandle/backbone-view/client-js/view.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@webhandle/backbone-view/client-js/view.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   View: () => (/* binding */ View)
/* harmony export */ });
/* harmony import */ var _generate_id_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./generate-id.js */ "./node_modules/@webhandle/backbone-view/client-js/generate-id.js");
/* harmony import */ var _event_entry_mapper_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./event-entry-mapper.js */ "./node_modules/@webhandle/backbone-view/client-js/event-entry-mapper.js");
/* harmony import */ var _extract_event_names_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./extract-event-names.js */ "./node_modules/@webhandle/backbone-view/client-js/extract-event-names.js");

// import pick from "./pick.js"



let defaultOptions = {
	// The default `tagName` of a View's element is `"div"`.
	tagName: 'div'
	
	, events: {}

}
let viewOptions = ['model', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

/**
 * A way to connect data to be displayed, a way to display it, and an organization
 * of functions to handle events.
 */
class View {
	constructor(options) {
		this.id = (0,_generate_id_js__WEBPACK_IMPORTED_MODULE_0__["default"])()
		Object.assign(this, defaultOptions)
		this.preinitialize.apply(this, arguments);
		Object.assign(this, options)
		this._ensureElement()
		this.initialize.apply(this, arguments);
	}


	/**
	 * preinitialize is an empty function by default. You can override it with a function
	 * or object.  preinitialize will run before any instantiation logic is run in the View
	 */
	preinitialize() { }

	/**
	 * Initialize is an empty function by default. Override it with your own
	 * initialization logic.
	 */
	initialize() { }

	/**
	 * **render** is the core function that your view should override, in order
	 * to populate its element (`this.el`), with the appropriate HTML. The
	 * convention is for **render** to always return `this`.
	 * @returns this
	 */
	render() {
		return this
	}
	
	/**
	 * Removes the element from the dom. Does not disable event listeners
	 */
	remove() {
		this.el.parentElement.removeChild(this.el)
	}
	
	/**
	 * Adds this view as a child to a containing element. Nothing special is going on here.
	 * This is just a shortcut for container.appendChild
	 * @param {Element} container 
	 */
	appendTo(container) {
		container.appendChild(this.el)
	}

	/**
	 * Clears the contents of the container and adds this view.
	 * @param {Element} container 
	 */
	replaceContentsOf(container) {
		container.innerHTML = ''
		this.appendTo(container)
	}

	/**
	 * Set the element for this view, and if new, adds listeners to it in accordance
	 * with the "events" member.
	 * @param {Element} el The dom element which will be the root of this view
	 * @returns this
	 */
	setElement(el) {
		if (this.el !== el) {
			this.el = el
			this._addListeners()
		}
		return this
	}

	/**
	 * Produces a DOM element to be assigned to your view. Exposed for
	 * subclasses using an alternative DOM manipulation API.
	 * @param {string} name The element tag name
	 * @returns The dom element
	 */
	_createElement(name) {
		let el = document.createElement(name)
		el.setAttribute('id', this.id)
		el.view = this
		return el
	}

	/**
	 * Ensures that the element exists. Applies attributes and className
	 * to it regardless
	 */
	_ensureElement() {
		if (!this.el) {
			this.setElement(this._createElement(this.tagName))
		}
		else {
			this._addListeners()
		}
		this._setAttributes()
		if (this.className) {
			this.el.classList.add(this.className)
		}
	}

	/**
	 * Set attributes from a hash on this view's element.  Exposed for
	 * subclasses using an alternative DOM manipulation API.
	 * @param {object} attributes 
	 */
	_setAttributes(attributes) {
		if (this.attributes) {
			for (let [key, value] of Object.entries(this.attributes)) {
				this.el.setAttribute(key, value)
			}
		}
	}

	/**
	 * 
	 * Set callbacks, where `this.events` is a hash of
	 * *{"event selector": "callback"}*
	 *
	 *    {
	 *       'mousedown .title':  'edit',
	 *       'click .button':     'save',
	 *       'click .open':       function(e) { ... },
	 *       'keydown .':     	  'handleKey'
	 *    }
	 * pairs. Callbacks will be bound to the view, with `this` set properly.
	 * 
	 * 
	 * Note that the selector `.` will match the root element and can be used
	 * as a final chance to handle events or for events like an escape key
	 * which are essentially global to the widget.
	 * 
	 */
	_addListeners() {
		this.eventTriggers = Object.entries(this.events).map(_event_entry_mapper_js__WEBPACK_IMPORTED_MODULE_1__["default"])
		let eventNames = (0,_extract_event_names_js__WEBPACK_IMPORTED_MODULE_2__["default"])(this.eventTriggers)		

		for(let eventName of eventNames) {
			this.el.addEventListener(eventName, this._eventHandler.bind(this))
		}
	}
	
	/**
	 * Get the elements from the view which match the selector
	 * @param {string} selector A css selector. `.` will select the root element
	 * @returns An array of elements
	 */
	_getCandidates(selector) {
		if(selector === '.') {
			return [this.el]
		}
		return Array.from(this.el.querySelectorAll(selector))
	}
	
	/**
	 * Handles all events for all elements within the view. It attempts to find a
	 * trigger matching the event and then process it. It will match and invoke
	 * only one trigger.
	 * @param {Event} evt 
	 */
	_eventHandler(evt) {
		for(let trigger of this.eventTriggers) {
			if(evt.type == trigger.event) {
				let candidates = this._getCandidates(trigger.selector)
				let found = null
				for(let candidate of candidates) {
					if(candidate === evt.target || candidate.contains(evt.target)) {
						found = candidate
						break
					}
				}
				if(found) {
					if(typeof trigger.handler === 'string') {
						this[trigger.handler].call(this, evt, found)
					}	
					else if(typeof trigger.handler === 'function') {
						trigger.handler.call(this, evt, found)
					}
					break
				}
			}
		}
	}
}


/***/ }),

/***/ "./node_modules/@webhandle/minimal-browser-event-emitter/client-js/event-emitter.mjs":
/*!*******************************************************************************************!*\
  !*** ./node_modules/@webhandle/minimal-browser-event-emitter/client-js/event-emitter.mjs ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ EventEmitter)
/* harmony export */ });
/* harmony import */ var _streamish_mjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./streamish.mjs */ "./node_modules/@webhandle/minimal-browser-event-emitter/client-js/streamish.mjs");


/**
 * Add this most basic of the EventEmitter functions (on, emit, removeListener) to the browser's
 * EventTarget functionality.
 * 
 * The eventEmitter.emit() method allows an arbitrary set of arguments to be passed to the listener 
 * functions. Keep in mind that when an ordinary listener function is called, the standard this 
 * keyword is intentionally set to reference the EventEmitter instance to which the listener is attached.
 */
let base = typeof EventTarget === 'undefined' ? _streamish_mjs__WEBPACK_IMPORTED_MODULE_0__["default"] : EventTarget
class EventEmitter extends base {
	constructor(target) {
		super(target)
		if(target) {
			this.innerEventTarget = target
		}
		else {
			this.innerEventTarget = this
		}
	}
	/**
	 * Adds the listener function to the end of the listeners array for the event named eventName. No checks 
	 * are made to see if the listener has already been added. Multiple calls passing the same combination 
	 * of eventName and listener will result in the listener being added, and called, multiple times.
	 * @param {string} eventName The event type name
	 * @param {*} listener The listener function where has arbitrary arguments
	 */
	on(eventName, listener) {
		if(this.innerEventTarget.addEventListener) {
			let nativeListener = (event) => {
				listener.apply(this, event.detail)
			}
			listener.nativeListener = nativeListener
			this.innerEventTarget.addEventListener(eventName, nativeListener)
		}
		else {
			super.on(eventName, listener)
		}
		return this
	}

	/**
	 * Synchronously calls each of the listeners registered for the event named eventName, in the order 
	 * they were registered, passing the supplied arguments to each.
	 * 
	 * @param {string} eventName The event type name
	 * @param  {...any} args 
	 */
	emit(eventName, ...args) {
		if(this.innerEventTarget.dispatchEvent) {
			this.innerEventTarget.dispatchEvent(this._makeEvent(eventName, args))
		}
		else {
			super.emit(eventName, ...args)
		}
		return this
	}

	/**
	 * Removes the specified listener from the listener array for the event named eventName.
	 * @param {string} eventName The event type name
	 * @param {function} listener The listener function
	 */
	removeListener(eventName, listener) {
		if(this.innerEventTarget.removeEventListener) {
			listener = listener.nativeListener || listener
			this.innerEventTarget.removeEventListener(eventName, listener)
		}
		else {
			super.removeListener(eventName, listener)
		}
		return this
	}
	
	_makeEvent(eventName, args) {
		if(typeof CustomEvent === 'function') {
			return new CustomEvent(eventName, {
				detail: args
			})
		}
		else {
			let evt = new Event(eventName)
			evt.detail = args
			return evt
		}
	}
}

/***/ }),

/***/ "./node_modules/@webhandle/minimal-browser-event-emitter/client-js/index.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/@webhandle/minimal-browser-event-emitter/client-js/index.js ***!
  \**********************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _streamish_mjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./streamish.mjs */ "./node_modules/@webhandle/minimal-browser-event-emitter/client-js/streamish.mjs");
/* harmony import */ var _event_emitter_mjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./event-emitter.mjs */ "./node_modules/@webhandle/minimal-browser-event-emitter/client-js/event-emitter.mjs");
let Emitter
;


if (typeof EventTarget !== 'undefined') {
	Emitter = _event_emitter_mjs__WEBPACK_IMPORTED_MODULE_1__["default"]
}
else {
	Emitter = _streamish_mjs__WEBPACK_IMPORTED_MODULE_0__["default"]
}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Emitter);

/***/ }),

/***/ "./node_modules/@webhandle/minimal-browser-event-emitter/client-js/streamish.mjs":
/*!***************************************************************************************!*\
  !*** ./node_modules/@webhandle/minimal-browser-event-emitter/client-js/streamish.mjs ***!
  \***************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Streamish)
/* harmony export */ });

class Streamish {
	constructor() {
		this.handles = {}
	}

	on(evt, handle) {
		let handles = this.handles[evt]
		if (!handles) {
			handles = this.handles[evt] = []
		}
		handles.push(handle)
		return this
	}

	emit(evt, ...args) {
		if (evt in this.handles) {
			for (let handle of this.handles[evt]) {
				handle.apply(this, args)
			}
		}
	}

	/**
	 * Removes the specified listener from the listener array for the event named eventName.
	 * @param {string} eventName The event type name
	 * @param {function} listener The listener function
	 */
	removeListener(eventName, listener) {
		if (eventName in this.handles) {
			this.handles[eventName] = this.handles[eventName].filter(func => {
				return func !== listener
			})
		}
	}
}

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*****************************!*\
  !*** ./client-js/pages.mjs ***!
  \*****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _client_lib_list_view_mjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../client-lib/list-view.mjs */ "./client-lib/list-view.mjs");



let elList1 = document.querySelector('.list1')
if(elList1) {
	let list1 = new _client_lib_list_view_mjs__WEBPACK_IMPORTED_MODULE_0__["default"]({
		el: elList1
		, mobileHandleSelector: '.cell .handle'
		, events: {
			'click a': 'linkClick'
		}
		, linkClick(evt, selected) {
			evt.preventDefault()
			console.log(selected.innerText)
		}
	})
	list1.render()
	
	let emitter = list1.emitter
	emitter.on('list-change', (evt) => {
		let eventLog = document.querySelector('.event-log')
		evt.cells.forEach(cell => {
			eventLog.innerHTML = eventLog.innerHTML + evt.type + ': ' + cell.innerText + '\n'
		})
	})
	

}


let elList2 = document.querySelector('.list2')
if(elList2) {
	let list2 = new _client_lib_list_view_mjs__WEBPACK_IMPORTED_MODULE_0__["default"]({
		el: elList2
		, mobileHandleSelector: '.cell .handle'
		, events: {
			'click a': 'linkClick'
		}
		, linkClick(evt, selected) {
			evt.preventDefault()
			console.log(selected.innerText)
		}
	})
	list2.render()
}

let elList4 = document.querySelector('.list4')
if(elList4) {
	let list4 = new _client_lib_list_view_mjs__WEBPACK_IMPORTED_MODULE_0__["default"]({
		el: elList4
		, mobileHandleSelector: '.cell .handle'
		, desktopHandleSelector: '.handle' 
		, events: {
			'click a': 'linkClick'
		}
		, linkClick(evt, selected) {
			evt.preventDefault()
			console.log(selected.innerText)
		}
	})
	list4.render()
}

document.querySelectorAll('.file-cells .cell').forEach(cell => {
	cell.addEventListener('dragstart', (evt) => {
		let uriListText = cell.getAttribute('data-uri-list')
		evt.dataTransfer.setData('text', uriListText)
		evt.dataTransfer.setData('text/uri-list', uriListText)
		
		if(! cell.classList.contains('no-label')) {
			let label = `data:text/label,${cell.innerText}`
			evt.dataTransfer.setData(label, label)
		}
	})
})



})();


//# sourceMappingURL=pages.js.map