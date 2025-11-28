# ValidateNRIC2020

A Python-based tool to validate and generate Singapore NRIC (National Registration Identity Card) checksum letters.

## Description

This project provides two Python scripts for working with Singapore NRIC numbers. It can validate whether a given NRIC is valid by checking its checksum letter, and can also calculate the correct checksum letter for an NRIC. The tool supports both Singaporean citizens (S/T prefix) and Foreigners (F/G prefix).

## Features

- Validate complete NRIC numbers by verifying the checksum letter
- Calculate the correct checksum letter for NRIC numbers
- Support for Singaporean citizens (S/T prefix) and Foreigners (F/G prefix)
- Simple command-line interface

## Technologies Used

- Python 3

## Installation

```bash
# Clone the repository
git clone https://github.com/bryanseah234/validateNRIC2020.git

# Navigate to project directory
cd validateNRIC2020
```

## Usage

### Validate a complete NRIC (checksumv1.py)

```bash
python checksumv1.py
```

Enter the full NRIC when prompted to check if it's valid.

### Calculate the checksum letter (checksumv2.py)

```bash
python checksumv2.py
```

Enter the first 8 characters of the NRIC (prefix + 7 digits) to calculate the correct last letter.

## Disclaimer

1. FOR EDUCATIONAL PURPOSES ONLY
2. USE AT YOUR OWN DISCRETION

## License

MIT License

---

**Author:** <a href="https://github.com/bryanseah234">bryanseah234</a>
