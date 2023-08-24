from flask import Flask, render_template, request, jsonify
import random
from operator import itemgetter
import json
from flask_pymongo import pymongo


app = Flask(__name__)

sort_criteria = {
    "name": {"order": "asc", "key": "name"},
    "age": {"order": "asc", "key": "age"},
    "rating": {"order": "asc", "key": "rating"}
}

def generate_data():
    names = ["John", "Jane", "Alex", "Chris", "Martin", "Lucas", "Sophia", "Emma", "Olivia", "Ava"]
    data = []

    for i in range(30):
        name = random.choice(names)
        age = random.randint(20, 60)
        phone = f"010-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
        rating = round(random.uniform(0, 5) * 2) / 2
        data.append({"id": i+1, "name": name, "age": age, "phone": phone, "rating": rating})

    return data

def save_data():
    with open('data.json', 'w') as f:
        json.dump(data, f)

def load_data():
    global data
    try:
        with open('data.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        data = generate_data()

data = generate_data()
max_id = max([item["id"] for item in data])

@app.route('/')
@app.route('/<int:page>')
@app.route('/<sort_by>/<int:page>')
def index(sort_by="name", page=1):
    global sort_criteria
    search_column = request.args.get('searchColumn', None)
    search_text = request.args.get('searchText', None)
    filtered_data = data

    if search_column and search_text:
        if search_column in ["name", "phone"]:
            filtered_data = [d for d in filtered_data if search_text.lower() in d[search_column].lower()]
        elif search_column == "age":
            try:
                search_age = int(search_text)
                filtered_data = [d for d in filtered_data if d[search_column] == search_age]
            except ValueError:
                filtered_data = []
        elif search_column == "rating":
            try:
                search_rating = float(search_text)
                filtered_data = [d for d in filtered_data if round(d[search_column]) == search_rating]
            except ValueError:
                filtered_data = []

    order = sort_criteria[sort_by]["order"]
    sort_key = sort_criteria[sort_by]["key"]
    sorted_data = sorted(filtered_data, key=itemgetter(sort_key), reverse=(order == "desc"))
    
    sort_criteria[sort_by]["order"] = "desc" if order == "asc" else "asc"
    
    start = (page-1) * 15
    end = start + 15
    page_data = sorted_data[start:end]
    
    for item in page_data:
        full_stars = int(item["rating"])
        half_star = 1 if item["rating"] - full_stars >= 0.5 else 0
        item["full_stars"] = full_stars
        item["half_star"] = half_star

        total_pages = len(filtered_data) // 15 + (1 if len(filtered_data) % 15 > 0 else 0)
    return render_template('board.html', data=page_data, page=page, total_pages=total_pages, sort_by=sort_by, order=order)

@app.route('/add', methods=['POST'])
def add_entry():
    try:
        global max_id
        max_id += 1
        name = request.form.get("name")
        age = int(request.form.get("age", 0))
        phone = request.form.get("phone")
        rating = float(request.form.get("rating", 0))

        new_entry = {
            "id": max_id,
            "name": name,
            "age": age,
            "phone": phone,
            "rating": rating
        }
        data.append(new_entry)
        response_data = {"success": True, "message": "Entry added successfully!", "new_entry": new_entry}
        return jsonify(response_data)
    except ValueError:
        return jsonify(success=False, message="Invalid input provided!")

@app.route('/edit/<int:id>', methods=['POST'])
def edit_entry(id):
    entry = next((item for item in data if item["id"] == id), None)
    print(request.form)
    if entry:
        entry["name"] = request.form.get("name")
        age_value = request.form.get("age", "").strip()
        entry["age"] = int(age_value) if age_value else 0   
        entry["phone"] = request.form.get("phone")
        entry["rating"] = float(request.form.get("rating", 0))

        response_data = {"success": True, "message": "Entry edited successfully!", "edited_entry": entry}
        return jsonify(response_data)
    else:
        return jsonify(success=False, message="Entry not found!")

@app.route('/delete', methods=['POST'])
def delete_entries():
    try:
        selected_ids = request.form.getlist("selected_ids[]")
        global data
        data = [item for item in data if item["id"] not in map(int, selected_ids)]
        return jsonify(success=True, message="Selected items deleted successfully!")
    except Exception as e:
        return jsonify(success=False, message=str(e))

if __name__ == "__main__":
    app.run(debug=True)
