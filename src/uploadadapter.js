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
		const {
			uploadUrl,
			fileFormName,
			createImageData,
			upload
		} = this.editor.config.get( 'filemanager' );

		if ( !uploadUrl && !upload ) {
			return;
		}

		this.editor.plugins.get( FileRepository ).createUploadAdapter = loader => new UploadAdapter( {
			loader,
			url: uploadUrl,
			t: this.editor.t,
			fileFormName,
			createImageData,
			upload
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
		loader, url, t, fileFormName, createImageData, upload
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
		this.fileFormName = fileFormName || 'file';

		this.createImageData = createImageData || defaultCreateImageData;

		this._upload = upload || this._defaultUpload;
	}

	_defaultUpload( { file, setProgress } ) {
		return new Promise( ( resolve, reject ) => {
			this._initRequest();
			this._initListeners( resolve, reject, file, setProgress );
			this._sendRequest( file );
		} );
	}

	_setProgress( { total, loaded } ) {
		const loader = this.loader;
		loader.uploadTotal = total;
		loader.uploaded = loaded;
	}

	/**
	 * Starts the upload process.
	 *
	 * @see module:upload/filerepository~UploadAdapter#upload
	 * @returns {Promise.<Object>}
	 */
	upload() {
		return this.loader.file.then( file => {
			return this._upload( {
				file,
				setProgress: this._setProgress.bind( this )
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
		xhr.withCredentials = true;

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
	_initListeners( resolve, reject, file, setProgress ) {
		const xhr = this.xhr;
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
					setProgress( {
						total: evt.total,
						loaded: evt.loaded
					} );
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
