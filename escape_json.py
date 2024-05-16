import json

def escape_for_json(data):
    """
    Escape special characters for JSON and convert to a single line string.
    """
    return json.dumps(data)

def main():
    # Read the content of the multipart cloud-init file
    with open("/Users/schuhm/phd/visa/gc/userdata.txt", "r") as file:
        cloud_init_data = file.read()

    # Escape the content for JSON
    escaped_data = escape_for_json(cloud_init_data)

    # Output the escaped data
    print(escaped_data)

if __name__ == "__main__":
    main()
