
from huggingface_hub import hf_hub_download
import os


if __name__ == "__main__":
    repo_id = "Real-IAD/Real-IAD"
    filenames = ["realiad_1024/phone_battery.zip","realiad_jsons.zip"]

    for filename in filenames:
        downloaded_path = hf_hub_download(
            repo_id=repo_id,
            repo_type="dataset",
            filename=filename,
            local_dir="./realiad",
            local_dir_use_symlinks=False 
        )

        print("Downloaded file to:", downloaded_path)


    print("All files downloaded.")