"""
Setup script for blockchain indexer.
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="proton-blockchain-indexer",
    version="0.1.0",
    author="Your Name",
    description="Stream Proton blockchain data into SQL database for analytics",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/proton-blockchain-indexer",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Database",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.28.0",
        "sqlalchemy>=1.4.0",
        "pandas>=1.5.0",
        "click>=8.1.0",
        "pyyaml>=6.0",
    ],
    extras_require={
        "postgres": ["psycopg2-binary>=2.9.0"],
        "viz": ["streamlit>=1.20.0", "plotly>=5.13.0"],
        "dev": ["pytest>=7.2.0", "black>=23.0.0", "flake8>=6.0.0"],
    },
    entry_points={
        "console_scripts": [
            "blockchain-indexer=src.main:cli",
        ],
    },
)
