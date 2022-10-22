/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals XMLHttpRequest, FormData */

/**
 * @module adapter-filemanager/uploadadapter
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import FileRepository from '@ckeditor/ckeditor5-upload/src/filerepository';

/**
 * TODO
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileManagerUploadAdapter extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileRepository ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileManagerUploadAdapter';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const url = this.editor.config.get( 'filemanager.uploadUrl' );
		const fileFormName = this.editor.config.get( 'filemanager.fileFormName' ) || 'file';
		const createImageData = this.editor.config.get( 'filemanager.createImageData' );

		if ( !url ) {
			return;
		}

		this.editor.plugins.get( FileRepository ).createUploadAdapter = loader => new UploadAdapter( {
			loader,
			url,
			t: this.editor.t,
			fileFormName,
			createImageData
		} );
	}
}

const defaultCreateImageData = response => ( {
	...response,
	urls: {
		default: response.url
	}
} );

/**
 * Upload adapter for the file manager.
 *
 * @private
 * @implements module:upload/filerepository~UploadAdapter
 */
class UploadAdapter {
	/**
	 * Creates a new adapter instance.
	 *
	 * @param {module:upload/filerepository~FileLoader} loader
	 * @param {String} url
	 * @param {module:utils/locale~Locale#t} t
	 * @param {String} fileFormName
	 */
	constructor( {
		loader, url, t, fileFormName, createImageData
	} ) {
		/**
		 * FileLoader instance to use during the upload.
		 *
		 * @member {module:upload/filerepository~FileLoader} #loader
		 */
		this.loader = loader;

		/**
		 * Upload URL.
		 *
		 * @member {String} #url
		 */
		this.url = url;

		/**
		 * Locale translation method.
		 *
		 * @member {module:utils/locale~Locale#t} #t
		 */
		this.t = t;

		/**
		 * FormData field name for file
		 *
		 * @member {String} #fileFormName
		 */
		this.fileFormName = fileFormName;

		this.createImageData = createImageData || defaultCreateImageData;
	}

	/**
	 * Starts the upload process.
	 *
	 * @see module:upload/filerepository~UploadAdapter#upload
	 * @returns {Promise.<Object>}
	 */
	upload() {
		return this.loader.file.then( file => {
			return new Promise( ( resolve, reject ) => {
				this._initRequest();
				this._initListeners( resolve, reject, file );
				this._sendRequest( file );
			} );
		} );
	}

	/**
	 * Aborts the upload process.
	 *
	 * @see module:upload/filerepository~UploadAdapter#abort
	 */
	abort() {
		if ( this.xhr ) {
			this.xhr.abort();
		}
	}

	/**
	 * Initializes the XMLHttpRequest object.
	 *
	 * @private
	 */
	_initRequest() {
		const xhr = this.xhr = new XMLHttpRequest();

		xhr.open( 'POST', this.url, true );
		xhr.responseType = 'json';
	}

	/**
	 * Initializes XMLHttpRequest listeners.
	 *
	 * @private
	 * @param {Function} resolve Callback function to be called when the request is successful.
	 * @param {Function} reject Callback function to be called when the request cannot be completed.
	 * @param {File} file File instance to be uploaded.
	 */
	_initListeners( resolve, reject, file ) {
		const xhr = this.xhr;
		const loader = this.loader;
		const t = this.t;
		const genericError = t( 'Cannot upload file:' ) + ` ${ file.name }.`;

		xhr.addEventListener( 'error', () => reject( genericError ) );
		xhr.addEventListener( 'abort', () => reject() );
		xhr.addEventListener( 'load', () => {
			const response = xhr.response;

			if ( !response ) {
				return reject( response && response.error && response.error.message ? response.error.message : genericError );
			}

			resolve( this.createImageData( response ) );
		} );

		// Upload progress when it's supported.
		/* istanbul ignore else */
		if ( xhr.upload ) {
			xhr.upload.addEventListener( 'progress', evt => {
				if ( evt.lengthComputable ) {
					loader.uploadTotal = evt.total;
					loader.uploaded = evt.loaded;
				}
			} );
		}
	}

	/**
	 * Prepares the data and sends the request.
	 *
	 * @private
	 * @param {File} file File instance to be uploaded.
	 */
	_sendRequest( file ) {
		// Prepare form data.
		const data = new FormData();
		data.append( this.fileFormName, file );

		// Send request.
		this.xhr.send( data );
	}
}
