Upload adapter for CKEditor 5
========================================

By default, Ckeditor5-adapter-ckfinder uploads file with the FormData name is "upload". This package allow to have a custom FormData name.

Config:

```javascript
filemanager: {
	uploadUrl: string, // upload url
	fileFormName: string, // custom FormData name of uploading file
	createImageData: (responseData) => { urls: { default: string, /* others size */ } } // if the response data from uploadUrl is not match with the image format https://ckeditor.com/docs/ckeditor5/latest/features/images/image-upload/simple-upload-adapter.html#successful-upload, then you can define a adapter method to create the image data.
}
```

## TODO

- [ ] allow select uploaded file
