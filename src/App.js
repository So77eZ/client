import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css"; // Подключаем CSS стили

const App = () => {
  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString("en-CA"); // Формат YYYY-MM-DD
    const time = now.toLocaleTimeString("en-CA", { hour12: false }); // Формат HH:MM:SS
    return { date, time };
  };

  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    weight: "",
    animal: "cat",
  });
  const [editingId, setEditingId] = useState(null); // Добавляем состояние для редактирования
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRecords();
    const { date, time } = getCurrentDateTime();
    setFormData({ ...formData, date, time });
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/records");
      setRecords(response.data);
    } catch (error) {
      console.error("Ошибка при получении записей:", error);
    }
  };

  const validateForm = () => {
    const errors = {};
    const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

    if (!formData.date) {
      errors.date = "Дата обязательна.";
    } else if (formData.date > today) {
      errors.date = "Дата не может быть больше текущей.";
    }

    if (!formData.weight) {
      errors.weight = "Вес обязателен.";
    } else if (isNaN(formData.weight) || formData.weight <= 0) {
      errors.weight = "Вес должен быть положительным числом.";
    } else if (formData.weight > 10000) {
      errors.weight = "Вес не может превышать 10000 грамм.";
    }

    if (!["cat", "dog", "hamster"].includes(formData.animal)) {
      errors.animal = "Некорректный тип животного.";
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      const dateTimeISO = formatToISODateTime(formData.date, formData.time); // Преобразуем дату и время

      const updatedFormData = {
        ...formData,
        date: dateTimeISO,
      };

      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/records/${editingId}`,
          updatedFormData
        );
        setEditingId(null);
      } else {
        await axios.post("http://localhost:5000/api/records", updatedFormData);
      }
      fetchRecords();

      // Сброс формы с текущей датой и временем
      const { date, time } = getCurrentDateTime();
      setFormData({ date, time, weight: "", animal: "cat" });
      setErrors({});
    } catch (error) {
      if (error.response) {
        alert(
          `Ошибка: ${error.response.data.errors
            .map((err) => err.msg)
            .join(", ")}`
        );
      } else {
        alert("Произошла ошибка при сохранении записи.");
      }
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const [date] = isoDate.split("T"); // Получаем только дату в формате YYYY-MM-DD
    return date;
  };

  const formatDateTimeForDisplay = (isoDateTime) => {
    if (!isoDateTime) return "";
    const date = new Date(isoDateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatToISODateTime = (date, time) => {
    if (!date || !time) return "";
    // Создаем объект Date в локальном времени
    const [year, month, day] = date.split("-");
    const [hours, minutes, seconds] = time.split(":");
    const localDateTime = new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      seconds
    );
    return localDateTime.toISOString(); // Преобразуем в ISO формат
  };

  const handleEdit = (record) => {
    const dateTime = new Date(record.date);
    const formattedDate = dateTime.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const formattedTime = dateTime.toLocaleTimeString("en-CA", {
      hour12: false,
    }); // HH:MM:SS
    setFormData({
      date: formattedDate,
      time: formattedTime,
      weight: record.weight,
      animal: record.animal,
    });
    setEditingId(record.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Вы уверены, что хотите удалить эту запись?")) {
      try {
        await axios.delete(`http://localhost:5000/api/records/${id}`);
        fetchRecords();
      } catch (error) {
        alert("Произошла ошибка при удалении записи.");
      }
    }
  };

  return (
    <div className="container">
      <h1>Записи кормушки</h1>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="date">Дата</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className={errors.date ? "input-error" : ""}
          />
          {errors.date && <span className="error-text">{errors.date}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="time">Время</label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
            className={errors.time ? "input-error" : ""}
          />
          {errors.time && <span className="error-text">{errors.time}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="weight">Вес (граммы)</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            placeholder="Вес (граммы)"
            required
            className={errors.weight ? "input-error" : ""}
            max="10000"
          />
          {errors.weight && <span className="error-text">{errors.weight}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="animal">Животное</label>
          <select name="animal" value={formData.animal} onChange={handleChange}>
            <option value="cat">Кот</option>
            <option value="dog">Собака</option>
            <option value="hamster">Хомяк</option>
          </select>
          {errors.animal && <span className="error-text">{errors.animal}</span>}
        </div>
        <button type="submit" className="btn-primary">
          {editingId ? "Сохранить изменения" : "Добавить запись"}
        </button>
      </form>
      <ul className="record-list">
        {records.map((record) => (
          <li key={record.id} className="record-item">
            {new Date(record.date).toLocaleString("en-CA", { timeZone: "UTC" })}
            : {record.weight} г, {record.animal}
            <div className="actions">
              <button onClick={() => handleEdit(record)} className="btn-edit">
                Редактировать
              </button>
              <button
                onClick={() => handleDelete(record.id)}
                className="btn-delete"
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
