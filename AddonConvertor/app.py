from flask import Flask, request, send_from_directory, jsonify, url_for, send_file
import os
import datetime
import subprocess
import shutil
import zipfile
import threading
import time

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

def create_fxmanifest(output_folder):
    """
    Creates the fxmanifest.lua file in the specified output_folder.
    """
    fxmanifest_content = """
fx_version 'cerulean'

game 'gta5'

description 'Globbing Template made by PLOK'

files {
    'data/**/*.meta'
}

data_file 'HANDLING_FILE' 'data/**/handling.meta'
data_file 'VEHICLE_LAYOUTS_FILE' 'data/**/vehiclelayouts.meta'
data_file 'VEHICLE_METADATA_FILE' 'data/**/vehicles.meta'
data_file 'CARCOLS_FILE' 'data/**/carcols.meta'
data_file 'VEHICLE_VARIATION_FILE' 'data/**/carvariations.meta'
data_file 'DLCTEXT_FILE' 'data/**/dlctext.meta'
data_file 'CARCONTENTUNLOCKS_FILE' 'data/**/carcontentunlocks.meta'
"""
    fxmanifest_path = os.path.join(output_folder, 'fxmanifest.lua')
    with open(fxmanifest_path, 'w') as f:
        f.write(fxmanifest_content)

    return fxmanifest_path

def move_files_to_folders(output_folder):
    """
    Moves extracted stream, data, and fxmanifest.lua files into separate folders.
    """
    stream_folder = os.path.join(output_folder, 'stream')
    data_folder = os.path.join(output_folder, 'data')

    os.makedirs(stream_folder, exist_ok=True)
    os.makedirs(data_folder, exist_ok=True)

    fxmanifest_file = create_fxmanifest(output_folder)

    for root, dirs, files in os.walk(output_folder):
        for file in files:
            src_path = os.path.join(root, file)
            if file.endswith('.ytd') or file.endswith('.yft'):
                shutil.move(src_path, os.path.join(stream_folder, file))
            elif file.endswith('.meta'):
                shutil.move(src_path, os.path.join(data_folder, file))

    return stream_folder, data_folder, fxmanifest_file

def create_zip(output_folder, ytd_filename):
    """
    Creates a ZIP archive containing stream, data, and fxmanifest.lua files only.
    """
    zip_filename = f"{ytd_filename.split('.')[0]}.zip"
    zip_path = os.path.join(PROCESSED_FOLDER, zip_filename)
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        stream_folder, data_folder, fxmanifest_file = move_files_to_folders(output_folder)

        # Add stream files to ZIP
        for root, dirs, files in os.walk(stream_folder):
            for file in files:
                zipf.write(os.path.join(root, file), os.path.relpath(os.path.join(root, file), output_folder))

        # Add data files to ZIP
        for root, dirs, files in os.walk(data_folder):
            for file in files:
                zipf.write(os.path.join(root, file), os.path.relpath(os.path.join(root, file), output_folder))

        # Add fxmanifest.lua to ZIP directly to the main folder
        zipf.write(fxmanifest_file, os.path.basename(fxmanifest_file))

    return zip_path

def delete_processed_files(output_folder, zip_path):
    """
    Deletes processed files and the created ZIP file after a delay.
    """
    time.sleep(45)  # Wait for 45 seconds
    shutil.rmtree(output_folder, ignore_errors=True)
    os.remove(zip_path)
    print(f"Deleted processed files and ZIP file in {output_folder}")

def send_discord_notification(message):
    """
    Sends a Discord webhook notification with the given message.
    """
    import requests

    webhook_url = "https://discord.com/api/webhooks/1258850834331074610/ARx6-4PzA79Vl9UZI-4d6D8OvkU6IKeMLoSnKPGllN7sU0Cis_I7HEPZOD1MrjtnxJ6W"
    data = {
        "content": message
    }
    headers = {
        "Content-Type": "application/json"
    }
    response = requests.post(webhook_url, json=data, headers=headers)
    if response.status_code != 204:
        print(f"Failed to send Discord notification: {response.status_code}, {response.text}")

@app.route('/')
def index():
    return send_file('vehicle-conversions.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'rpfFile' not in request.files:
            return "No file part", 400

        file = request.files['rpfFile']
        if file.filename == '':
            return "No selected file", 400

        if file and file.filename.endswith('.rpf'):
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            save_path = os.path.join(UPLOAD_FOLDER, f"{timestamp}_{file.filename}")
            file.save(save_path)

            # Create a folder for processed files
            output_folder = os.path.join(PROCESSED_FOLDER, f"{timestamp}_{file.filename}")
            os.makedirs(output_folder, exist_ok=True)

            # Call gtautil.exe to extract the archive, specifying the output folder
            extract_cmd = ['gtautil', 'extractarchive', '--input', save_path, '--output', output_folder]
            subprocess.run(extract_cmd, check=True)

            # Find the primary .ytd file (assuming it's the most relevant for renaming)
            ytd_filename = None
            for root, dirs, files in os.walk(output_folder):
                for file in files:
                    if file.endswith('.ytd'):
                        ytd_filename = file
                        break
                if ytd_filename:
                    break

            if not ytd_filename:
                return "No .ytd file found in the extracted files", 500

            # Create a ZIP archive of the processed folders
            zip_path = create_zip(output_folder, ytd_filename)

            # Rename the main folder to match the .ytd file's base name
            new_folder_name = os.path.join(PROCESSED_FOLDER, f"{timestamp}_{ytd_filename.split('.')[0]}")
            os.rename(output_folder, new_folder_name)

            # Schedule deletion of processed files and ZIP file after 45 seconds
            threading.Thread(target=delete_processed_files, args=(new_folder_name, zip_path)).start()

            # Send Discord notification
            send_discord_notification(f"User has completed merge of {ytd_filename.split('.')[0]}")

            # Generate download link for the ZIP file
            download_link = url_for('download_file', filename=os.path.basename(zip_path), _external=True)

            return jsonify(status="Success", message=f"File uploaded, unpacked, and processed. Download here: {download_link}", download_link=download_link)

    except subprocess.CalledProcessError as e:
        return f"Error during processing: {e}", 500
    except Exception as e:
        return f"Unexpected error: {e}", 500

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(PROCESSED_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True)
