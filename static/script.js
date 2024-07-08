let zip = new JSZip(); // Define JSZip instance

        function toggleFileList() {
            const fileList = document.getElementById('fileList');
            fileList.classList.toggle('hide');
        }

        function toggleSupporterOptions() {
            const supporterOptions = document.getElementById('supporterOptions');
            supporterOptions.classList.toggle('show');
        }

        document.getElementById('folderInput').addEventListener('change', function(e) {
            const files = e.target.files;
            const fileList = document.getElementById('fileList');
            const progressMessage = document.getElementById('progressMessage');
            const downloadLink = document.getElementById('downloadLink');

            if (files.length > 150) {
                document.getElementById('folderInput').classList.add('red-outline');
                errorMessage.style.display = 'block'; // Display error message
                // Clear file list and hide progress message and download link
                fileList.innerHTML = '';
                progressMessage.style.display = 'none';
                downloadLink.style.display = 'none';
                return; // Exit function, preventing further execution
            } else {
                document.getElementById('folderInput').classList.remove('red-outline');
                errorMessage.style.display = 'none'; // Hide error message if less than or equal to 25 files
            }

            fileList.innerHTML = ''; // Clear file list
            progressMessage.style.display = 'block'; // Show progress message

            const mainFolderName = 'Main Folder';
            const streamFolderName = 'stream';
            const dataFolderName = 'data';
            const fxManifestFileName = 'fxmanifest.lua';

            const folderMap = {};
            let streamFiles = [];
            let totalFiles = 0;
            let processedFiles = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileName = file.name.toLowerCase();

                if (fileName.endsWith('.meta') || fileName.endsWith('.yft') || fileName.endsWith('.ytd')) {
                    const fileInfo = document.createElement('p');
                    fileInfo.textContent = fileName;
                    document.getElementById('fileList').appendChild(fileInfo);
                }
            }

            const entries = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileName = file.name.toLowerCase();

                if (fileName.endsWith('.meta') || fileName.endsWith('.yft') || fileName.endsWith('.ytd')) {
                    entries.push(file);
                }
            }

            totalFiles = entries.length;

            entries.forEach(entry => {
                handleFile(entry);
            });

            function handleFile(file) {
                const fileName = file.name.toLowerCase();
                const fileType = getFileType(fileName);

                if (fileType === 'meta') {
                    handleMetaFile(file);
                } else if (fileType === 'yft' || fileType === 'ytd') {
                    handleStreamFile(file);
                } else {
                    updateProgress();
                }
            }

            function getFileType(fileName) {
                if (fileName.endsWith('.meta')) {
                    return 'meta';
                } else if (fileName.endsWith('.yft')) {
                    return 'yft';
                } else if (fileName.endsWith('.ytd')) {
                    return 'ytd';
                } else {
                    return '';
                }
            }

            function handleMetaFile(file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const content = e.target.result;
                    const fileName = file.name;

                    const vehicleName = file.webkitRelativePath.split('/')[1]; // Extract vehicle name from path

                    const dataFolder = createDataFolder(vehicleName); // Create or get existing data folder for the vehicle

                    dataFolder.file(fileName, content); // Add meta file to the vehicle's data folder

                    updateProgress();
                };
                reader.readAsText(file);
            }

            function createDataFolder(vehicleName) {
                const mainFolder = zip.folder(mainFolderName);
                const dataFolder = mainFolder.folder(dataFolderName);
                return dataFolder.folder(vehicleName); // Create or get existing vehicle folder inside data folder
            }

            function handleStreamFile(file) {
                streamFiles.push({
                    vehicle: file.webkitRelativePath.split('/')[1], // Extract vehicle name from path
                    file: file
                });

                updateProgress();
            }

            function updateProgress() {
                processedFiles++;
                const progressMessage = document.getElementById('progressMessage');
                if (progressMessage) {
                    progressMessage.textContent = `Processing ${processedFiles} of ${totalFiles} files...`;
                    if (processedFiles === totalFiles) {
                        createFolderStructureAndDownloadLink();
                    }
                }
            }

            function createFolderStructureAndDownloadLink() {
                const mainFolder = zip.folder(mainFolderName);
                const streamFolder = mainFolder.folder(streamFolderName);
                const dataFolder = mainFolder.folder(dataFolderName);

                // Update FXManifest.lua content
                let fxManifestContent = 'fx_version \'cerulean\'\n\n';
                fxManifestContent += 'game \'gta5\'\n\n';
                fxManifestContent += 'description \'Red Leaf Modifications Car Merger\'\n\n';
                fxManifestContent += 'files {\n';
                fxManifestContent += '    \'data/**/*.meta\'\n';
                fxManifestContent += '}\n\n';

                // Data files
                fxManifestContent += `data_file 'HANDLING_FILE' 'data/**/handling.meta'\n`;
                fxManifestContent += `data_file 'VEHICLE_LAYOUTS_FILE' 'data/**/vehiclelayouts.meta'\n`;
                fxManifestContent += `data_file 'VEHICLE_METADATA_FILE' 'data/**/vehicles.meta'\n`;
                fxManifestContent += `data_file 'CARCOLS_FILE' 'data/**/carcols.meta'\n`;
                fxManifestContent += `data_file 'VEHICLE_VARIATION_FILE' 'data/**/carvariations.meta'\n`;
                fxManifestContent += `data_file 'DLCTEXT_FILE' 'data/**/dlctext.meta'\n`;
                fxManifestContent += `data_file 'CARCONTENTUNLOCKS_FILE' 'data/**/carcontentunlocks.meta'\n`;

                // Add .meta files to data folder
                const metaFileNames = Object.keys(folderMap);

                metaFileNames.forEach(fileName => {
                    const vehicleName = fileName.split('/')[1]; // Extract vehicle name
                    const dataFolderForVehicle = createDataFolder(vehicleName); // Create or get existing data folder for the vehicle

                    dataFolderForVehicle.file(fileName, folderMap[fileName]); // Add meta file to the vehicle's data folder
                });

                // Add .yft and .ytd files to stream folder
                const streamFilePromises = streamFiles.map(item => {
                    const { vehicle, file } = item;
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            streamFolder.folder(vehicle).file(file.name, e.target.result); // Adjusted for nested folder creation
                            resolve();
                        };
                        reader.readAsArrayBuffer(file);
                    });
                });

                Promise.all(streamFilePromises)
                    .then(() => {
                        // Add FXManifest.lua file to main folder
                        mainFolder.file(fxManifestFileName, fxManifestContent);

                        // Generate ZIP and create download link
                        zip.generateAsync({ type: 'blob' })
                            .then(function(blob) {
                                const url = URL.createObjectURL(blob);
                                const downloadLink = document.getElementById('downloadLink');
                                downloadLink.href = url;
                                downloadLink.style.display = 'inline-block'; // Show download link
                            })
                            .catch(function(error) {
                                console.error('Error generating ZIP:', error);
                            });
                    })
                    .catch(function(error) {
                        console.error('Error adding stream files to ZIP:', error);
                    });
            }
        });