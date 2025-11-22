import os
from PIL import Image, ImageOps

def split_icons(image_path, output_dir):
    try:
        # Load the image
        img = Image.open(image_path).convert("RGBA")
        
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # Convert to grayscale to find bounding boxes
        gray = img.convert("L")
        # Invert so that background (white) becomes black (0) and content becomes white
        # Assuming white background
        bw = gray.point(lambda x: 0 if x > 240 else 255, '1')
        
        # Find bounding box of all content
        bbox = bw.getbbox()
        if not bbox:
            print("No content found.")
            return

        # Naive grid splitting - assuming 4x3 grid based on 12 items requested
        # But first, let's try to find connected components or just split by grid if it looks regular.
        # Since DALL-E grids are often irregular, a better approach for "neat grid" prompts 
        # is to scan for empty rows and columns.
        
        width, height = img.size
        pixels = bw.load()
        
        # Find empty rows
        empty_rows = []
        for y in range(height):
            is_empty = True
            for x in range(width):
                if pixels[x, y] != 0:
                    is_empty = False
                    break
            if is_empty:
                empty_rows.append(y)
                
        # Find empty columns
        empty_cols = []
        for x in range(width):
            is_empty = True
            for y in range(height):
                if pixels[x, y] != 0:
                    is_empty = False
                    break
            if is_empty:
                empty_cols.append(x)

        # Group consecutive empty lines to find cuts
        def get_cuts(empty_indices, max_val):
            cuts = [0]
            if not empty_indices:
                return [0, max_val]
            
            # Find gaps in empty_indices which represent content
            # Actually, we want the middle of the empty regions
            
            # Simpler: just find the large gaps in the empty_indices list?
            # No, empty_indices are the lines to CUT.
            # We want to find segments of non-empty lines.
            
            segments = []
            start = None
            for i in range(max_val):
                if i not in empty_indices:
                    if start is None:
                        start = i
                else:
                    if start is not None:
                        segments.append((start, i))
                        start = None
            if start is not None:
                segments.append((start, max_val))
            return segments

        row_segments = get_cuts(set(empty_rows), height)
        col_segments = get_cuts(set(empty_cols), width)

        print(f"Found {len(row_segments)} rows and {len(col_segments)} columns of icons.")
        
        count = 1
        saved_files = []
        
        # Names based on the requested order, hoping the grid follows it (usually left-to-right, top-to-bottom)
        names = [
            "pencil", "eraser", "paint_bucket", "eye_dropper", 
            "selection_box", "hand_move", "zoom", "floppy_disk", 
            "open_folder", "undo", "redo", "trash"
        ]
        
        name_idx = 0
        
        for y_start, y_end in row_segments:
            for x_start, x_end in col_segments:
                # Crop
                icon = img.crop((x_start, y_start, x_end, y_end))
                
                # Trim whitespace around the specific icon
                icon_bbox = icon.getbbox()
                if icon_bbox:
                    # icon = icon.crop(icon_bbox) # Optional: keep original grid size or trim tight? 
                    # Trimming tight is usually better for assets, but let's keep a bit of padding or resize to 16x16 if possible?
                    # For now, let's just save the cropped region.
                    pass
                
                if name_idx < len(names):
                    filename = f"{names[name_idx]}.png"
                else:
                    filename = f"icon_{count}.png"
                
                save_path = os.path.join(output_dir, filename)
                icon.save(save_path)
                saved_files.append(filename)
                print(f"Saved {filename}")
                
                count += 1
                name_idx += 1

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    split_icons(
        r"c:\Users\salam\Documents\Programacion\Mideas\src\assets\icons\tools_pixel_art.png",
        r"c:\Users\salam\Documents\Programacion\Mideas\src\assets\icons"
    )
