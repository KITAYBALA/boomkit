import zipfile
import xml.etree.ElementTree as ET
import os

def read_docx(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    print(f"Reading: {file_path}")
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Namespaces used in docx xml
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            # Find all paragraph text elements
            texts = []
            for para in root.findall('.//w:p', namespaces):
                para_text = ""
                for run in para.findall('.//w:r', namespaces):
                    text_elem = run.find('w:t', namespaces)
                    if text_elem is not None and text_elem.text:
                        para_text += text_elem.text
                if para_text:
                    texts.append(para_text)
            print("\n".join(texts))
    except Exception as e:
        print(f"Error reading docx: {e}")

print("=== BOOMKIT PASSWORD ===")
read_docx(r"c:\Users\oktay\Desktop\boomkit password.docx")

print("\n=== SECRET BOOMKIT CODE ===")
read_docx(r"c:\Users\oktay\Desktop\Secret boomkit code.docx")
