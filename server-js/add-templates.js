import webhandle from "webhandle"
import escapeAttributeValue from './utils/escape-attribute-value.js'

let templates = {};

export default function loadTemplates() {
	webhandle.templateLoaders.push((name, callback) => {
		callback(templates[name])
	})

	templates['escAttr'] = (val) => {
		if (val && typeof val == 'string') {
			return escapeAttributeValue(val, true)
		}
		return val
	}

	templates['dus'] = (data) => {
		let length
		try {
			if(Number.isInteger(data)) {
				length = data	
			}
			else if(Number.isInteger(parseInt(data))) {
				length = parseInt(data)
			}
		}
		catch(e) {}
		if(length) {
			let s = ''
			while(length > 0) {
				s += '_'
				length--
			}
			return s
		}
		else {
			return '__'
		}
	}
	templates['insert-public-file-contents'] = () => {
	}

	templates['insert-public-file-contents'].write = (thedata, stream, callback) => {
		webhandle.sinks.project.read('public' + thedata, (err, data) => {
			if (data) {
				stream.write(data.toString(), "UTF-8", () => {
					if (callback) {
						callback()
					}
				})
			} else {
				if (callback) {
					callback()
				}
			}
		})
	}

	templates['insert-public-directory-contents'] = () => {
	}

	templates['insert-public-directory-contents'].write = (thedata, stream, callback) => {
		webhandle.sinks.project.getFullFileInfo('public' + thedata, (err, data) => {
			if (data) {
				let result = ''
				function readNextFile() {

					if(data.children.length == 0) {
						stream.write(result, "UTF-8", () => {
							if (callback) {
								callback()
							}
						})
					}
					else {
						let child = data.children.pop()
						webhandle.sinks.project.read(child.relPath, (err, fileData) => {
							result += fileData.toString()
							readNextFile()
						})
					}
				}
				readNextFile()
			} else {
				if (callback) {
					callback()
				}
			}
		})
	}
}

