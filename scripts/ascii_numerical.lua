-- ascii.lua

-- ASCII art character set from dense to sparse
local chars = {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}

-- Convert pixel brightness (grayscale) to an ASCII character
local function pixelToChar(gray)
  -- Normalize grayscale value (0-255) to brightness (0.0-1.0)
  local brightness = gray / 255
  -- Map brightness (0.0 to 1.0) to an index in the chars table
  -- math.max ensures index is at least 1, math.min ensures it doesn't exceed table length
  local index = math.floor(brightness * (#chars - 1)) + 1
  index = math.max(1, math.min(index, #chars)) -- Clamp index to valid range
  return chars[index]
end

-- Convert an image file to an ASCII art string using FFmpeg and ffprobe
local function imageToAscii(imagePath, targetWidth)
  targetWidth = targetWidth or 70 -- Default ASCII width if not provided

  -- 1. Get image dimensions using ffprobe
  -- Use -v error to suppress verbose output, get width,height in csv format
  local ffprobeCmd = string.format("ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 %s", imagePath)
  local dims
  -- Use pcall for safe execution of external command
  local success, err = pcall(function()
    -- Use "r" mode for reading text output
    local f = io.popen(ffprobeCmd, "r")
    if not f then error("Failed to execute ffprobe command.") end
    dims = f:read("*l") -- Read the first line (e.g., "1920x1080")
    f:close()
    if not dims or dims == "" then error("ffprobe returned empty dimensions.") end
  end)

  if not success then
    return nil, "Error getting image dimensions: " .. (err or "Unknown ffprobe error")
  end

  -- Parse dimensions
  local originalWidth, originalHeight = dims:match("(%d+)x(%d+)")
  if not originalWidth then
     return nil, "Could not parse dimensions from ffprobe output: '" .. dims .. "'"
  end
  originalWidth, originalHeight = tonumber(originalWidth), tonumber(originalHeight)

  -- 2. Calculate target height maintaining aspect ratio
  -- Adjust height by ~0.5 factor because terminal characters are often taller than wide
  local targetHeight = math.floor(originalHeight * (targetWidth / originalWidth * 0.5))
  -- Ensure targetHeight is at least 1
  targetHeight = math.max(1, targetHeight)

  -- 3. Use FFmpeg to get raw grayscale pixel data, scaled to target dimensions
  -- -f rawvideo outputs raw pixel data, -pix_fmt gray specifies 8-bit grayscale
  local ffmpegCmd = string.format("ffmpeg -i %s -vf scale=%d:%d -f rawvideo -pix_fmt gray -",
                           imagePath, targetWidth, targetHeight)
  local rawPixelData
  success, err = pcall(function()
    -- Use "r" mode - Lua's io.popen doesn't support binary mode on all platforms
    local f = io.popen(ffmpegCmd, "r")
    if not f then error("Failed to execute ffmpeg command.") end
    rawPixelData = f:read("*a") -- Read all data
    f:close()
    if not rawPixelData or #rawPixelData == 0 then error("ffmpeg returned empty pixel data.") end
  end)

  if not success then
    return nil, "Error processing image with ffmpeg: " .. (err or "Unknown ffmpeg error")
  end

  -- 4. Convert raw pixel data (grayscale bytes) to ASCII string
  local asciiArt = ""
  local expectedDataSize = targetWidth * targetHeight -- 1 byte per pixel (grayscale)
  if #rawPixelData < expectedDataSize then
      -- Warn about incomplete data but proceed if possible
      print(string.format("Warning: Incomplete pixel data received. Expected %d bytes, got %d.", expectedDataSize, #rawPixelData))
  end

  local pos = 1
  for y = 1, targetHeight do
    for x = 1, targetWidth do
      -- Check if enough data remains for one pixel (1 byte)
      if pos <= #rawPixelData then
        local gray = string.byte(rawPixelData, pos)
        asciiArt = asciiArt .. pixelToChar(gray)
        pos = pos + 1
      else
        -- Not enough data for a full pixel, add padding or break
        asciiArt = asciiArt .. " " -- Add a space as padding
        if x < targetWidth then -- Fill rest of the row with spaces if data ended mid-row
           asciiArt = asciiArt .. string.rep(" ", targetWidth - x)
        end
        goto next_row -- Jump out of inner loop if data ends prematurely
      end
    end
    asciiArt = asciiArt .. "\n" -- Newline after each row
    ::next_row:: -- Label for goto statement
  end

  return asciiArt, nil -- Return result and nil for error
end

-- Main execution block: parses command-line arguments and calls imageToAscii
local function main()
  if not arg[1] then
    print("Usage: lua ascii.lua <image_path> [output_file]")
    os.exit(1)
  end

  local imagePath = arg[1]
  local outputFile = arg[2]

  -- Call the conversion function
  local result, err = imageToAscii(imagePath)

  -- Handle potential errors during conversion
  if err then
    io.stderr:write("Error: " .. err .. "\n")
    os.exit(1)
  end

  -- Print the resulting ASCII art to the console
  print(result)

  -- Optionally save the result to a specified file
  if outputFile then
    local file, openErr = io.open(outputFile, "w")
    if file then
      file:write(result)
      file:close()
      print("\nASCII art saved to " .. outputFile)
    else
      io.stderr:write("\nError: Could not write to file '" .. outputFile .. "': " .. (openErr or "Unknown error") .. "\n")
      -- Don't exit here, maybe user only wanted console output
    end
  end
end

-- Run the main function
main()