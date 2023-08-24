$(document).ready(function() {
    let selectedRows = [];

    // Search function
    $(".search-btn").click(function() {
        performSearch();
    });

    $("#searchText").on("keyup", function(event) {
        if (event.keyCode === 13) {
            $(".search-btn").click();
        }
    });

    function performSearch() {
        const column = document.getElementById("searchColumn").value;
        const query = document.getElementById("searchText").value;
        location.href = `/?searchColumn=${column}&searchText=${query}`;
    }

    // Checkbox selection
    $(document).on("change", "tbody tr td input[type='checkbox']", function() {
        let row = $(this).closest("tr");
        if ($(this).prop("checked")) {
            row.addClass("table-primary");
            selectedRows.push(row);
        } else {
            row.removeClass("table-primary");
            selectedRows = selectedRows.filter(selected => selected !== row);
        }
    });

    // Edit Entry
    $("#editButton").on("click", function(event) {
        event.stopPropagation();

        let checkedRows = $("tbody tr td input[type='checkbox']:checked").closest("tr");
        if (checkedRows.length !== 1) {
            alert("하나의 행만 선택하여 수정하세요.");
            return;
        }

        let row = $(checkedRows[0]);
        let id = row.attr("data-id");
        let name = row.find("td:eq(2)").text();
        let age = row.find("td:eq(3)").text();
        let phone = row.find("td:eq(4)").text();
        let fullStars = row.find("td:eq(5) .fa-star").length;
        let halfStar = row.find("td:eq(5) .fa-star-half-alt").length * 0.5;
        let rating = fullStars + halfStar;

        $("#editId").val(id);
        $("#editName").val(name);
        $("#editAge").val(age);
        $("#editPhone").val(phone);
        $("#editRating").val(rating);
        $("#editModal").modal('show');
    });

    // Update on server after editing
    $("#editModal .btn-primary").on("click", function() {
        let id = $("#editId").val();
        let name = $("#editName").val();
        let age = $("#editAge").val();
        let phone = $("#editPhone").val();
        let rating = $("#editRating").val();
        
        $.post(`/edit/${id}`, {
            name: name,
            age: age,
            phone: phone,
            rating: rating
        }, function(response) {
            console.log("Server Response:", response);
    
            if (response && response.success) {
                // Update the row in the table
                let row = $(`tr[data-id="${id}"]`);
                row.find("td:eq(2)").text(name);  // Update the name
                row.find("td:eq(3)").text(age);   // Update the age
                row.find("td:eq(4)").text(phone); // Update the phone
    
                // Update the rating
                let ratingCell = row.find("td:eq(5)");
                ratingCell.empty(); // Clear existing stars
    
                let fullStars = Math.floor(response.edited_entry.rating);
                let halfStar = (response.edited_entry.rating - fullStars) >= 0.5 ? 1 : 0;
    
                for (let i = 0; i < fullStars; i++) {
                    ratingCell.append('<i class="fas fa-star"></i>');
                }
    
                if (halfStar) {
                    ratingCell.append('<i class="fas fa-star-half-alt"></i>');
                }
    
            } else {
                alert(response.message || "An error occurred while editing.");
            }
        }).fail(function() {
            alert("An error occurred while editing.");
        });
    });
    

    // Add Entry
    $("#addModal .btn-primary").on("click", function() {
        let name = $("#addName").val();
        let age = $("#addAge").val();
        let phone = $("#addPhone").val();
        let rating = $("#addRating").val();
        
        $.post("/add", {
            name: name,
            age: age,
            phone: phone,
            rating: rating
        }, function(response) {
            if (response && response.success) {
                // New row to the table
                let newRow = `
                    <tr data-id="${response.new_entry.id}">
                        <td><input type="checkbox"></td>
                        <td>${response.new_entry.name}</td>
                        <td>${response.new_entry.age}</td>
                        <td>${response.new_entry.phone}</td>
                        <td>${response.new_entry.rating}</td>
                    </tr>
                `;
    
                $("table tbody").append(newRow);
            } else {
                alert(response.message || "An error occurred while adding.");
            }
        }).fail(function() {
            alert("An error occurred while adding.");
        });
    });
    
    

    // Delete Entries
    $("#deleteButton").on("click", function(event) {
        event.stopPropagation();
    
        let selectedIds = [];
        $("input[type=checkbox]:checked").each(function() {
            let row = $(this).closest("tr");
            let id = row.data("id");
            selectedIds.push(id);
        });
    
        // 선택된 항목이 없는 경우 경고 메시지 표시
        if (selectedIds.length === 0) {
            alert("삭제할 항목을 선택하세요.");
            return;
        }
    
        // 확인 메시지 표시
        let userConfirmed = confirm("선택된 항목을 삭제하시겠습니까?");
        if (!userConfirmed) {
            return;  // 사용자가 취소를 누른 경우 작업 중지
        }
    
        // 서버에 삭제 요청
        $.post("/delete", {selected_ids: selectedIds}, function(response) {
            if (response && response.success) {
                // 테이블에서 행 삭제
                $("input[type=checkbox]:checked").closest("tr").remove();
            } else {
                alert(response.message || "삭제 중 오류가 발생했습니다.");
            }
        }).fail(function() {
            alert("삭제 중 오류가 발생했습니다.");
        });
    });
    
});
