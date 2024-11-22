import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function KanbanBoard({ tasks, onTaskUpdate }) {
    const [columns, setColumns] = useState({});

    useEffect(() => {
        const groupedTasks = tasks.reduce((acc, task) => {
            acc[task.status] = acc[task.status] || [];
            acc[task.status].push(task);
            return acc;
        }, {});

        setColumns(groupedTasks);
    }, [tasks]);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const { source, destination } = result;

        // Update task status
        if (source.droppableId !== destination.droppableId) {
            const task = columns[source.droppableId][source.index];
            onTaskUpdate({ ...task, status: destination.droppableId });
        }
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div style={{ display: 'flex', gap: '20px' }}>
                {Object.keys(columns).map((status) => (
                    <Droppable key={status} droppableId={status}>
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '5px',
                                    padding: '10px',
                                    width: '250px',
                                }}
                            >
                                <h3>{status}</h3>
                                {columns[status].map((task, index) => (
                                    <Draggable
                                        key={task._id}
                                        draggableId={task._id}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={{
                                                    padding: '10px',
                                                    margin: '5px 0',
                                                    backgroundColor: '#f9f9f9',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '3px',
                                                    ...provided.draggableProps.style,
                                                }}
                                            >
                                                <h4>{task.title}</h4>
                                                <p>{task.description}</p>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                ))}
            </div>
        </DragDropContext>
    );
}
