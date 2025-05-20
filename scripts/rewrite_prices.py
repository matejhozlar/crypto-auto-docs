from openpyxl import load_workbook


workbook = load_workbook("../Weekly_performance_modified.xlsx")

sheet = workbook["ONCHAIN"]

empty_count = 0
row = 2

while empty_count < 10:
    f_cell = sheet[f'F{row}']
    d_cell = sheet[f'D{row}']

    if f_cell.value is not None and isinstance(f_cell.value, (int, float)):
        d_cell.value = f_cell.value
        empty_count = 0
    else:
        empty_count +=1

    row+=1

workbook.save("../updated_file.xlsx")
