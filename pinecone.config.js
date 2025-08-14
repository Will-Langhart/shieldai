/** @type require('pinecone-cli').Config */
export default {
	"options": {
		"source": "./themes/_pinecone-color-theme.json",
		"output": "./themes",
		"prefix": "$",
		"watch": false,
		"tidy": false,
		"includeNonItalicVariants": false
	},
	"variants": {
		"caffe": {
			"name": "Caffè",
			"type": "dark"
		},
		"latte": {
			"name": "Caffè Latte",
			"type": "light"
		}
	},
	"colors": {
		"transparent": "#0000",
		"background": {
			"caffe": "#36261b",
			"latte": "#faf8f6"
		},
		"foreground": {
			"caffe": "#d5bbaa",
			"latte": "#c29d84"
		}
	}
}