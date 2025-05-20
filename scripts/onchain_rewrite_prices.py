from openpyxl import load_workbook

workbook = load_workbook("../docs/Weekly_performance_modified.xlsx")

sheet = workbook["ONCHAIN"]
FILE_NAME = "../docs/updated_file.xlsx"
STOP_EMPTY_LIMIT = 10

empty_count = 0
row = 2

while empty_count < STOP_EMPTY_LIMIT:
    f_cell = sheet[f'F{row}']
    d_cell = sheet[f'D{row}']

    if f_cell.value is not None and isinstance(f_cell.value, (int, float)):
        d_cell.value = f_cell.value
        empty_count = 0
    else:
        empty_count +=1

    row+=1

workbook.save(FILE_NAME)
print(f"✅ Successfully rewrited prices into file: {FILE_NAME}")
