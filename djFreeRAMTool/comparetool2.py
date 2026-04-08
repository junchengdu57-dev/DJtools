#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
内存测试报告对比工具 - 差异聚焦版
只输出报告B相对于报告A的差异：新增进程、内存占用增大的进程。
支持GUI选择文件，生成简洁HTML报告，可导出CSV。
"""

import os
import webbrowser
import tempfile
import pandas as pd
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

# ========== 数据处理模块 ==========
def read_table_by_header(excel_path, sheet_name, header_keyword, skip_rows=0):
    """读取 Excel 中以某个关键词为标题，其下一行为表头的表格。"""
    df_raw = pd.read_excel(excel_path, sheet_name=sheet_name, header=None)
    title_row = None
    for idx, row in df_raw.iterrows():
        row_str = ' '.join([str(v) for v in row if pd.notna(v)])
        if header_keyword in row_str:
            title_row = idx
            break
    if title_row is None:
        return None
    header_row = title_row + 1 + skip_rows
    if header_row >= len(df_raw):
        return None
    df = pd.read_excel(excel_path, sheet_name=sheet_name, header=header_row)
    df = df.dropna(how='all').dropna(axis=1, how='all')
    return df

def read_persistent_summary(excel_path):
    """读取常驻进程内存占用超标 Summary，返回进程名和异常占用均值"""
    df = read_table_by_header(excel_path, "内存标准检测结果", "常驻进程内存占用超标 Summary")
    if df is None:
        return None
    df.columns = df.columns.str.strip().str.replace('\n', ' ')
    # 定位进程名列
    proc_col = None
    for col in df.columns:
        if '进程名' in col:
            proc_col = col
            break
    if proc_col is None:
        proc_col = df.columns[0]
    df.rename(columns={proc_col: "进程名"}, inplace=True)
    # 只保留必要列：进程名、异常占用均值(MB)
    mean_col = None
    for col in df.columns:
        if '异常占用均值' in col and 'MB' in col:
            mean_col = col
            break
    if mean_col is None:
        return None
    df = df[["进程名", mean_col]].copy()
    df.columns = ["进程名", "异常占用均值(MB)"]
    df = df[df["进程名"].notna()]
    return df

def read_native_70_table(excel_path):
    """读取 Native 内存占用超出层级 70% 的进程表格，返回进程名和内存占用(MB)"""
    df = read_table_by_header(excel_path, "内存标准检测整体统计",
                              "Native 内存占用之和超出层级70%的进程(按均值排列)")
    if df is None:
        return None
    df.columns = df.columns.str.strip().str.replace('\n', ' ')
    if df.shape[1] >= 2:
        df = df.iloc[:, [0, 1]].copy()
        df.columns = ["进程名", "内存占用(MB)"]
        df = df[df["进程名"].notna()]
        return df
    return None

def read_new_process_list(excel_path):
    """读取新增传音自研/预装进程 Summary，返回进程名集合"""
    df = read_table_by_header(excel_path, "内存标准检测结果", "新增传音自研/预装进程 Summary")
    if df is None:
        return set()
    first_col = df.columns[0]
    processes = df[first_col].dropna().unique()
    return set(processes)

# ========== 差异计算 ==========
def get_persistent_diff(df_a, df_b):
    """比较常驻进程的异常占用均值，返回增量大于0的进程列表"""
    if df_a is None or df_b is None:
        return None
    merged = pd.merge(df_a, df_b, on="进程名", how="inner", suffixes=("_A", "_B"))
    merged["增量(MB)"] = merged["异常占用均值(MB)_B"] - merged["异常占用均值(MB)_A"]
    # 只保留增量 > 0 的进程
    diff = merged[merged["增量(MB)"] > 0].copy()
    diff = diff.sort_values("增量(MB)", ascending=False)
    diff = diff[["进程名", "异常占用均值(MB)_A", "异常占用均值(MB)_B", "增量(MB)"]]
    diff.columns = ["进程名", "报告A均值(MB)", "报告B均值(MB)", "增量(B-A)(MB)"]
    return diff

def get_native_diff(df_a, df_b):
    """比较Native进程内存占用，返回增量大于0的进程列表"""
    if df_a is None or df_b is None:
        return None
    merged = pd.merge(df_a, df_b, on="进程名", how="inner", suffixes=("_A", "_B"))
    merged["增量(MB)"] = merged["内存占用(MB)_B"] - merged["内存占用(MB)_A"]
    diff = merged[merged["增量(MB)"] > 0].copy()
    diff = diff.sort_values("增量(MB)", ascending=False)
    diff = diff[["进程名", "内存占用(MB)_A", "内存占用(MB)_B", "增量(MB)"]]
    diff.columns = ["进程名", "报告A内存(MB)", "报告B内存(MB)", "增量(B-A)(MB)"]
    return diff

def get_new_processes(set_a, set_b):
    """返回仅在报告B中新增的进程列表"""
    return sorted(set_b - set_a)

def get_removed_processes(set_a, set_b):
    """返回仅在报告A中存在（报告B中已移除）的进程列表，供参考"""
    return sorted(set_a - set_b)

# ========== HTML 生成（差异聚焦） ==========
def generate_diff_html(persistent_diff, native_diff, new_proc_list, removed_proc_list,
                       file1_name, file2_name, output_path):
    """生成只显示差异的简洁HTML报告"""
    # 转换为HTML表格的函数
    def df_to_html(df, title):
        if df is None or df.empty:
            return f"<p><strong>{title}</strong>：无</p>"
        html = f'<h3>{title}</h3>'
        html += '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">'
        html += '<thead><tr>' + ''.join(f'<th>{col}</th>' for col in df.columns) + '</tr></thead><tbody>'
        for _, row in df.iterrows():
            html += '<tr>' + ''.join(f'<td>{row[col]}</td>' for col in df.columns) + '</tr>'
        html += '</tbody></table>'
        return html

    def list_to_html(items, title):
        if not items:
            return f"<p><strong>{title}</strong>：无</p>"
        html = f'<h3>{title}</h3><ul>'
        for item in items:
            html += f'<li>{item}</li>'
        html += '</ul>'
        return html

    html_content = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>内存测试报告差异对比</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
        .container {{ background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); margin-bottom: 20px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        .export-btn {{ background-color: #008CBA; color: white; padding: 8px 16px; border: none; cursor: pointer; border-radius: 4px; margin-bottom: 10px; font-size: 14px; }}
        .footer {{ margin-top: 30px; font-size: 12px; color: #777; text-align: center; }}
    </style>
    <script>
        function exportToCSV(tableId, filename) {{
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
        <h1>内存测试报告差异对比</h1>
        <p><strong>基准报告A：</strong>{file1_name}</p>
        <p><strong>对比报告B：</strong>{file2_name}</p>
        <p><strong>生成时间：</strong>{pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
        <p>以下仅列出报告B相对于报告A的<strong>新增项</strong>和<strong>内存占用增大项</strong>。</p>
    </div>

    <div class="container">
        <h2>一、新增进程</h2>
        {list_to_html(new_proc_list, "新增自研/预装进程（报告B独有）")}
    </div>

    <div class="container">
        <h2>二、内存占用增大的进程</h2>
        {df_to_html(persistent_diff, "1. 常驻进程超标 - 异常占用均值增大")}
        {df_to_html(native_diff, "2. Native超70%进程 - 内存占用增大")}
    </div>

    <div class="container">
        <h2>三、附：报告A中已移除的进程（仅供参考）</h2>
        {list_to_html(removed_proc_list, "仅在报告A中存在的自研/预装进程")}
    </div>

    <div class="footer">
        提示：点击下方按钮可导出对应表格数据为CSV。
    </div>
</body>
</html>
    """
    # 为每个表格添加导出按钮（在HTML中动态添加）
    # 因为表格可能多个，需要为每个表格生成唯一的id和按钮
    # 更简单的做法：在表格上方加一个导出按钮，但为了简化，我们不在这里做复杂的DOM修改，
    # 用户可以复制表格内容。如果需要，可以后续手动添加。但为了满足“支持下载”，我们可以在每个表格区域添加一个按钮。
    # 重新生成带导出按钮的版本：
    def add_export_buttons(html):
        # 在第一个表格前插入导出按钮
        import re
        # 为每个表格区域添加按钮
        pattern = r'(<h3>.*?</h3>)(<table.*?>.*?</table>)'
        def replacer(match):
            title = match.group(1)
            table = match.group(2)
            # 生成唯一id
            import hashlib
            table_id = hashlib.md5(table.encode()).hexdigest()[:8]
            table_with_id = table.replace('<table', f'<table id="{table_id}"', 1)
            button = f'<button class="export-btn" onclick="exportToCSV(\'{table_id}\', \'差异数据.csv\')">导出此表格为CSV</button><br>'
            return title + button + table_with_id
        html = re.sub(pattern, replacer, html, flags=re.DOTALL)
        return html

    html_content = add_export_buttons(html_content)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

# ========== GUI 界面 ==========
class CompareApp:
    def __init__(self, root):
        self.root = root
        self.root.title("内存测试报告对比工具（差异版）")
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

        self.analyze_btn = tk.Button(self.root, text="开始分析差异", command=self.analyze, bg="#4CAF50", fg="white", font=("Arial", 12))
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

        self.status_label.config(text="正在分析差异，请稍候...")
        self.progress.start()
        self.analyze_btn.config(state="disabled")
        self.root.update()

        try:
            # 读取数据
            pers_a = read_persistent_summary(file1)
            pers_b = read_persistent_summary(file2)
            native_a = read_native_70_table(file1)
            native_b = read_native_70_table(file2)
            new_set_a = read_new_process_list(file1)
            new_set_b = read_new_process_list(file2)

            # 计算差异
            persistent_diff = get_persistent_diff(pers_a, pers_b)
            native_diff = get_native_diff(native_a, native_b)
            new_proc_list = get_new_processes(new_set_a, new_set_b)
            removed_proc_list = get_removed_processes(new_set_a, new_set_b)

            # 生成HTML
            temp_dir = tempfile.gettempdir()
            html_path = os.path.join(temp_dir, "memory_diff_report.html")
            generate_diff_html(persistent_diff, native_diff, new_proc_list, removed_proc_list,
                               os.path.basename(file1), os.path.basename(file2), html_path)

            webbrowser.open(html_path)
            self.status_label.config(text=f"分析完成！差异报告已生成并打开：{html_path}")
            messagebox.showinfo("完成", "差异对比完成，HTML报告已在浏览器中打开。\n每个表格上方都有“导出此表格为CSV”按钮。")

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