#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
内存测试报告对比工具 - 图形界面版
修复：正确识别表头行，增强列名匹配，支持导出CSV。
"""

import os
import webbrowser
import tempfile
import pandas as pd
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

# ========== 数据处理模块 ==========
def read_table_by_header(excel_path, sheet_name, header_keyword, skip_rows=0):
    """
    读取 Excel 中以某个关键词为标题，其下一行为表头的表格。
    返回 DataFrame，未找到返回 None。
    """
    df_raw = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
    title_row = None
    for idx, row in df_raw.iterrows():
        row_str = ' '.join([str(v) for v in row if pd.notna(v)])
        if header_keyword in row_str:
            title_row = idx
            break
    if title_row is None:
        return None

    # 表头在标题行的下一行
    header_row = title_row + 1 + skip_rows
    if header_row >= len(df_raw):
        return None

    # 读取从表头行开始的数据
    df = pd.read_excel(excel_path, sheet_name=sheet_name, header=header_row)
    # 删除全空行和全空列
    df = df.dropna(how='all').dropna(axis=1, how='all')
    return df


def read_persistent_summary(excel_path):
    """读取常驻进程内存占用超标 Summary"""
    df = read_table_by_header(excel_path, "内存标准检测结果",
                              "常驻进程内存占用超标 Summary")
    if df is None:
        return None

    # 清理列名（去除首尾空格、换行）
    df.columns = df.columns.str.strip().str.replace('\n', ' ')

    # 查找进程名列（可能为“进程名”或包含该词）
    proc_col = None
    for col in df.columns:
        if '进程名' in col:
            proc_col = col
            break
    if proc_col is None:
        # 若找不到，取第一列作为进程名
        proc_col = df.columns[0]
        df.rename(columns={proc_col: "进程名"}, inplace=True)
    else:
        df.rename(columns={proc_col: "进程名"}, inplace=True)

    # 保留关键列（如果存在）
    keep_cols = ["进程名", "进程所属层级", "异常次数",
                 "内存占用标准(MB)", "异常占用均值(MB)", "异常占用最大值(MB)"]
    existing = [c for c in keep_cols if c in df.columns]
    df = df[existing].copy()
    df = df[df["进程名"].notna()]
    return df


def read_native_70_table(excel_path):
    """读取 Native 内存占用超出层级 70% 的进程表格"""
    df = read_table_by_header(excel_path, "内存标准检测整体统计",
                              "Native 内存占用之和超出层级70%的进程(按均值排列)")
    if df is None:
        return None

    df.columns = df.columns.str.strip().str.replace('\n', ' ')
    # 期望前两列：进程名、内存占用(MB)
    if df.shape[1] >= 2:
        df = df.iloc[:, [0, 1]].copy()
        df.columns = ["进程名", "内存占用(MB)"]
        df = df[df["进程名"].notna()]
        return df
    return None


def read_new_process_list(excel_path):
    """读取新增传音自研/预装进程 Summary，返回进程名集合"""
    df = read_table_by_header(excel_path, "内存标准检测结果",
                              "新增传音自研/预装进程 Summary")
    if df is None:
        return set()
    # 表格通常只有一列，取第一列
    first_col = df.columns[0]
    processes = df[first_col].dropna().unique()
    return set(processes)


def compare_persistent(df1, df2):
    """对比常驻进程超标表格"""
    if df1 is None or df2 is None:
        return None
    merged = pd.merge(df1, df2, on="进程名", how="outer", suffixes=("_A", "_B"))
    for col in ["异常占用均值(MB)", "异常占用最大值(MB)", "异常次数"]:
        col_a = f"{col}_A"
        col_b = f"{col}_B"
        if col_a in merged.columns and col_b in merged.columns:
            merged[f"{col}_差异(B-A)"] = merged[col_b] - merged[col_a]
    return merged


def compare_native(df1, df2):
    """对比 Native 超 70% 进程表格"""
    if df1 is None or df2 is None:
        return None
    merged = pd.merge(df1, df2, on="进程名", how="outer", suffixes=("_A", "_B"))
    if "内存占用(MB)_A" in merged.columns and "内存占用(MB)_B" in merged.columns:
        merged["内存占用(MB)_差异(B-A)"] = merged["内存占用(MB)_B"] - merged["内存占用(MB)_A"]
    return merged


def compare_new_process(set1, set2):
    """对比新增进程列表"""
    all_proc = sorted(set1.union(set2))
    rows = []
    for p in all_proc:
        rows.append({
            "进程名": p,
            "报告A是否存在": p in set1,
            "报告B是否存在": p in set2,
            "差异状态": "仅报告A" if (p in set1 and p not in set2) else
                        "仅报告B" if (p not in set1 and p in set2) else "共有"
        })
    return pd.DataFrame(rows)


# ========== HTML 生成模块 ==========
def dataframe_to_html_table(df, table_id, caption=""):
    """将 DataFrame 转换为带 id 的 HTML 表格"""
    if df is None or df.empty:
        return "<p>无数据</p>"
    df = df.fillna("")
    html = f'<table id="{table_id}" border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">'
    if caption:
        html += f'<caption style="font-weight: bold; margin-bottom: 10px;">{caption}</caption>'
    html += "<thead><tr>"
    for col in df.columns:
        html += f"<th>{col}</th>"
    html += "<tr></thead><tbody>"
    for _, row in df.iterrows():
        html += "<tr>"
        for col in df.columns:
            html += f"<td>{row[col]}</td>"
        html += "</tr>"
    html += "</tbody></table>"
    return html


def generate_html_report(persistent_df, native_df, new_proc_df, file1_name, file2_name, output_path):
    """生成完整 HTML 报告，包含导出按钮"""
    html_template = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>内存测试报告对比结果</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
        .container {{ background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); margin-bottom: 20px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        .export-btn {{ background-color: #008CBA; color: white; padding: 8px 16px; border: none; cursor: pointer; border-radius: 4px; margin-bottom: 10px; font-size: 14px; }}
        .export-btn:hover {{ background-color: #005f6b; }}
        .footer {{ margin-top: 30px; font-size: 12px; color: #777; text-align: center; }}
    </style>
    <script>
        function exportTableToCSV(tableId, filename) {{
            let table = document.getElementById(tableId);
            if (!table) return;
            let rows = table.querySelectorAll("tr");
            let csv = [];
            for (let i = 0; i < rows.length; i++) {{
                let row = [], cols = rows[i].querySelectorAll("td, th");
                for (let j = 0; j < cols.length; j++) {{
                    let data = cols[j].innerText.replace(/(\\r\\n|\\n|\\r)/gm, '').replace(/(\\s*)/g, '');
                    row.push('"' + data.replace(/"/g, '""') + '"');
                }}
                csv.push(row.join(","));
            }}
            let blob = new Blob(["\\uFEFF" + csv.join("\\n")], {{ type: "text/csv;charset=utf-8;" }});
            let link = document.createElement("a");
            let url = URL.createObjectURL(blob);
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }}
    </script>
</head>
<body>
    <div class="container">
        <h1>内存测试报告对比结果</h1>
        <p><strong>报告A：</strong>{file1_name}</p>
        <p><strong>报告B：</strong>{file2_name}</p>
        <p><strong>生成时间：</strong>{pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
    </div>

    <div class="container">
        <h2>1. 常驻进程超标对比</h2>
        <button class="export-btn" onclick="exportTableToCSV('table_persistent', '常驻进程超标对比.csv')">导出为CSV</button>
        {dataframe_to_html_table(persistent_df, "table_persistent", "常驻进程超标对比详情")}
    </div>

    <div class="container">
        <h2>2. Native内存超70%进程对比</h2>
        <button class="export-btn" onclick="exportTableToCSV('table_native', 'Native超70%进程对比.csv')">导出为CSV</button>
        {dataframe_to_html_table(native_df, "table_native", "Native超70%进程内存占用对比")}
    </div>

    <div class="container">
        <h2>3. 新增传音自研/预装进程对比</h2>
        <button class="export-btn" onclick="exportTableToCSV('table_newproc', '新增进程对比.csv')">导出为CSV</button>
        {dataframe_to_html_table(new_proc_df, "table_newproc", "新增进程列表对比")}
    </div>

    <div class="footer">
        提示：点击表格上方的“导出为CSV”按钮可下载当前表格数据。
    </div>
</body>
</html>
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_template)


# ========== GUI 界面 ==========
class CompareApp:
    def __init__(self, root):
        self.root = root
        self.root.title("内存测试报告对比工具")
        self.root.geometry("700x400")
        self.root.resizable(True, True)

        self.file1_path = tk.StringVar()
        self.file2_path = tk.StringVar()

        self.create_widgets()

    def create_widgets(self):
        tk.Label(self.root, text="报告A (基准):").grid(row=0, column=0, sticky="e", padx=5, pady=10)
        tk.Entry(self.root, textvariable=self.file1_path, width=60).grid(row=0, column=1, padx=5, pady=10)
        tk.Button(self.root, text="浏览", command=lambda: self.browse_file(self.file1_path)).grid(row=0, column=2, padx=5, pady=10)

        tk.Label(self.root, text="报告B (对比):").grid(row=1, column=0, sticky="e", padx=5, pady=10)
        tk.Entry(self.root, textvariable=self.file2_path, width=60).grid(row=1, column=1, padx=5, pady=10)
        tk.Button(self.root, text="浏览", command=lambda: self.browse_file(self.file2_path)).grid(row=1, column=2, padx=5, pady=10)

        self.analyze_btn = tk.Button(self.root, text="开始分析", command=self.analyze, bg="#4CAF50", fg="white", font=("Arial", 12))
        self.analyze_btn.grid(row=2, column=1, pady=20)

        self.status_label = tk.Label(self.root, text="请选择两份Excel报告文件", relief="sunken", anchor="w")
        self.status_label.grid(row=3, column=0, columnspan=3, sticky="ew", padx=5, pady=10)

        self.progress = ttk.Progressbar(self.root, mode='indeterminate')
        self.progress.grid(row=4, column=0, columnspan=3, sticky="ew", padx=5, pady=5)

    def browse_file(self, var):
        filename = filedialog.askopenfilename(
            title="选择Excel报告文件",
            filetypes=[("Excel files", "*.xlsx"), ("All files", "*.*")]
        )
        if filename:
            var.set(filename)

    def analyze(self):
        file1 = self.file1_path.get().strip()
        file2 = self.file2_path.get().strip()
        if not file1 or not file2:
            messagebox.showerror("错误", "请完整选择两份报告文件！")
            return
        if not os.path.exists(file1) or not os.path.exists(file2):
            messagebox.showerror("错误", "文件不存在，请重新选择！")
            return

        self.status_label.config(text="正在分析，请稍候...")
        self.progress.start()
        self.analyze_btn.config(state="disabled")
        self.root.update()

        try:
            pers1 = read_persistent_summary(file1)
            pers2 = read_persistent_summary(file2)
            native1 = read_native_70_table(file1)
            native2 = read_native_70_table(file2)
            new1 = read_new_process_list(file1)
            new2 = read_new_process_list(file2)

            pers_comp = compare_persistent(pers1, pers2)
            native_comp = compare_native(native1, native2)
            new_comp = compare_new_process(new1, new2)

            temp_dir = tempfile.gettempdir()
            html_path = os.path.join(temp_dir, "memory_report_compare.html")
            generate_html_report(pers_comp, native_comp, new_comp,
                                 os.path.basename(file1), os.path.basename(file2),
                                 html_path)

            webbrowser.open(html_path)
            self.status_label.config(text=f"分析完成！报告已生成并打开：{html_path}")
            messagebox.showinfo("完成", "对比完成，HTML报告已在浏览器中打开。\n可点击表格上方的“导出为CSV”按钮下载数据。")

        except Exception as e:
            self.status_label.config(text="分析出错")
            messagebox.showerror("错误", f"分析过程中发生异常：\n{str(e)}")
        finally:
            self.progress.stop()
            self.analyze_btn.config(state="normal")


def main():
    root = tk.Tk()
    app = CompareApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()