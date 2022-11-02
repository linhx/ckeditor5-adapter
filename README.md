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

Or custom the upload method:

```javascript
filemanager: {
    upload({ file, setProgress }: { file: File, setProgress: ({ total, loaded }: { total: number, loaded: number }) => void }) {
    return FileRepository.uploadFile(file, (event) => {
        if (event.lengthComputable) {
        setProgress({
            total: event.total,
            loaded: event.loaded
        });
        }
    }).then(res => {
        return {
        ...res,
        urls: { default: new URL(res.url, import.meta.env.VITE_APP_API_URL).href}
        }
    }).catch(() => {
        throw `Cannot upload file: ${ file.name }.`;
    });
    }
},
```

## TODO

- [ ] File management (upload, select uploaded file...)
